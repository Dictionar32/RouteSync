# Phase 2858 — Fully Typed Runtime Scanner Operations Audit

## Scope

This phase extends the runtime trace from CLI manifest composition into the upstream controller-invocation inventory closure. The goal is to make the inventory result an executable domain ADT: each closed outcome must own the operation that lets the CLI continue from that outcome, rather than requiring the CLI to reconstruct domain decisions with primitive discriminator checks.

## Runtime trace

1. CLI scan/sync reaches `routeSyncCliManifestScanOperationFactory`.
2. The operation delegates to `controllerInvocationManifestCompositionAuthority.compose`.
3. Composition discovers controller sources, reads and binds source identities, produces invocation judgments, and closes the inventory through `laravelControllerInvocationSemanticJudgmentInventoryAuthority.close`.
4. The inventory authority now returns one of two explicit domain arms:
   - `laravel_controller_invocation_semantic_judgment_inventory_validated`, carrying the closure receipt and `continueWith`.
   - `laravel_controller_invocation_semantic_judgment_inventory_rejected`, carrying the source inventory, rejection ledger, and `continueWith`.
5. `closeInventory` consumes the result through `inventoryResult.continueWith({ onValidated, onRejected })`. The validated continuation prepares and builds the manifest; the rejected continuation converts the rejection into the CLI manifest terminal outcome.
6. Manifest construction retains its existing operated `ManifestBuilderJudgment` continuation into complete/blocked terminal operations.

## Runtime usage example

The consumer does not re-implement the inventory decision with `if (result.kind === ...)`; it invokes the ADT operation already attached to the judgment:

```ts
return inventoryResult.continueWith({
  onValidated: validated => manifestBuilderPreparation
    .prepare({
      kind: 'manifest_builder_input',
      invocationInventoryReceipt: validated.receipt,
      routeSelection,
    })
    .build()
    .then(controllerInvocationManifestTerminalOperationsFactory.fromManifestBuilderJudgment),
  onRejected: rejected => Promise.resolve(
    controllerInvocationManifestTerminalOperationsFactory.inventoryRejected({
      kind: 'controller_invocation_manifest_inventory_rejected',
      inventory: rejected,
    }),
  ),
});
```

The authority remains exported through its declared contract (`export const laravelControllerInvocationSemanticJudgmentInventoryAuthority: LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface = Object.freeze({...})`); the result is consumed through typed domain operations rather than an exported free function.

## Design changes

- Added named interfaces for validated and rejected inventory outcomes plus `LaravelControllerInvocationSemanticJudgmentInventoryResultHandlers<Result>`.
- Added private result constructors in `laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts`. The continuation closes over the exact result instance, so a rejection continuation retains the current rejection ledger as aggregation proceeds.
- Replaced `closeInventory`'s `if (kind === ...)` branching with the inventory ADT's domain continuation.
- Added tests that execute both validated and rejected continuation handlers.
- Exported the named ADT arm and handler contracts from `packages/core/src/index.ts`.
- Kept `packages/core/src/types/upstream/collections.ts` empty (0 bytes).

## Structural audit

`node scripts/audits/audit-phase2858-fully-typed-runtime-scanner-operations.cjs` checks the two-arm ADT, both continuation operations, constructors, CLI continuation dispatch, absence of primitive discriminator branches in `closeInventory`, absence of production `export function` declarations in the audited scanner/upstream/CLI paths, absence of relation imports in CLI, and the empty collections file.

The current structural audit passes **10/10 checks** over 825 production TypeScript files. It still finds 182 `semantic/relations` import statements across 91 files in the broader scanner/upstream/CLI scope. That migration is not claimed complete. The audited production paths contain no exported function declarations, but this is not a claim that every exported arrow-function factory across the repository has already been converted.

## Verification limits

TypeScript `transpileModule` syntax checks passed for the four changed TypeScript files. The structural audit and `package.json` parse passed. Full semantic typecheck, Vitest, package build, and CLI E2E are not claimed as passing: the snapshot has unresolved `semantic/relations` imports and an intentionally empty `collections.ts`, and the Vitest executable is unavailable in this workspace.

## TypeScript reference

The design uses TypeScript's documented discriminated-union narrowing/exhaustiveness and named interface contracts:
- https://www.typescriptlang.org/docs/handbook/2/narrowing
- https://www.typescriptlang.org/docs/handbook/interfaces
- https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
