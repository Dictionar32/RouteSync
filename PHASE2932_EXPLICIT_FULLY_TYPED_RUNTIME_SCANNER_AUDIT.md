# Phase2932 — Explicit Fully Typed Runtime Scanner Operations: CLI Manifest Trace

## Scope and evidence boundary

This is a source-level audit/model built from `RouteSync-Phase2931-Explicit-Source-Observation-Continuations.zip`. It follows the production CLI → manifest → Laravel route source observation path. It does not claim that a full TypeScript typecheck, Vitest, build, or CLI E2E was run.

## Runtime trace: CLI → upstream manifest → source observation

1. `packages/cli/src/commands/scan.ts` and `sync.ts` invoke the injected `composition.manifestScanOperation.scan(...)` operation.
2. `packages/cli/src/upstreamCompositionFactory.ts` composes the manifest scan operation via `routeSyncCliManifestScanOperationFactory`.
3. `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` composes source-document, controller-inventory, invocation-inventory and manifest-builder authorities.
4. `packages/core/src/types/upstream/manifestBuilderInterface.ts` owns the closed complete/blocked manifest judgment and its continuation operation.
5. The manifest builder's source AST pipeline reaches `LaravelRouteScannerInterface.prepare` through the scanner wiring.
6. `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts` resolves source files, obtains missing-file evidence, and delegates policy to `declarationCompositionAuthority.observeSourceFiles(...)`.
7. `packages/core/src/types/upstream/laravelRouteSourceSelection.ts` owns default-vs-explicit source policy. Default selection marks missing conventional files optional and emits a scannable inventory; explicit selection with missing files yields `laravel_route_scan_blocked` while preserving missing evidence.
8. Ready source inventory is read and parsed, route declarations become typed evidence/AST and semantic artifacts, then the scan judgment returns to manifest construction. A blocked source judgment must remain a blocked outcome, never become a successful empty manifest.

## Confirmed improvements already present in Phase2931

- Route-specific `visitScannableSources(): void`, `visitMissingFiles(): void`, and `visitFiles(): void` methods were removed from the source-selection ADT.
- Ready/blocked source observations expose named domain continuations (`continueWithScannableSources` / `preserveMissingSourceEvidence`).
- Explicit source selection exposes `selectedSourceFiles()`.
- Default missing-file classification checks all candidates and uses the existing source identity authority.
- `packages/core/src/types/upstream/collections.ts` remains empty.

These are existing archive changes, not new changes made by this report.

## Remaining root-level contract gap

`packages/core/src/types/upstream/names.ts` still exposes `SourceFileInventoryVisitorInterface.visit(...): void` and `SourceFileInventoryOperations.visitSources(...): void`. The empty inventory implements the visitor as a no-op. `laravelRouteScanner.ts` still branches on `sourceObservation.kind` to distinguish blocked from ready, then iterates the read-plan inventory with `visitSources`. Consequently the route-specific ADT has improved, but the shared inventory and scanner continuation boundary are not yet fully operation-owned.

This is the next concrete seam to evolve; do not introduce a generic `Collection<T>`, `Sequence<T>`, generic `Result<T>`, generic relation utility, or a fake empty/no-op domain result.

## Contract evolution proposal (reuse existing contracts first)

1. Evolve the existing `SourceFileInventoryOperations` in `names.ts`, rather than creating another collection abstraction. Add a domain operation that returns an explicit source-file inventory traversal outcome, preserving ordering and the empty/entry distinction. It must not expose `void` or silently run a no-op callback for empty inventories.
2. Replace the visitor callback with an operation whose result is useful to source reading, e.g. an inventory-owned ordered read plan. Keep filesystem I/O outside the ADT; inventory models which source identities are selected, not whether files exist.
3. Evolve `LaravelRouteSourceObservationJudgment` so both ready and blocked arms own a named continuation operation. The blocked arm must preserve missing-file evidence and must have no operation that yields a successful read plan. The ready arm may yield only its scannable inventory.
4. Move the blocked/ready dispatch into that source-observation ADT operation, or into an existing scanner boundary contract after checking current interfaces. The scanner should supply domain handlers, not reconstruct the source policy with `if (kind === ...)`.
5. Keep the AST parse boundary explicit. A failed read/parse/AST judgment must stay a typed blocked/rejected judgment; it must never be translated into an empty `SourceFileInventory` or a valid empty manifest.
6. Before adding any interface, audit `packages/core/src/types/upstream/index.ts` and existing source selection, scanner, inventory and manifest judgment contracts. Extend the closest existing contract only if its current semantics cannot express the required operation; document that gap first.

## Interface-first runtime shape

Public runtime exports should be explicitly typed object operations; implementation functions remain module-private. For example, when evolving the *existing* inventory contract (illustrative contract shape; names must be reconciled with the repository before implementation):

```ts
interface SourceFileInventoryReadPlanInterface {
  readonly create: (inventory: SourceFileInventory) => SourceFileReadPlanJudgment;
}

const createSourceFileReadPlan = (
  inventory: SourceFileInventory,
): SourceFileReadPlanJudgment => {
  // Domain-owned transformation; no filesystem reads here.
  // Must preserve empty vs populated inventory and source order.
};

export const sourceFileInventoryReadPlan: SourceFileInventoryReadPlanInterface = Object.freeze({
  create: createSourceFileReadPlan,
});
```

This is a design example, not a claim that this new interface has been added. In the implementation pass, first determine whether an existing `SourceFileInventoryOperations` member can be evolved directly; do not create this separate contract if that would duplicate existing ownership.

For existing exported operation objects, preserve the target style:

```ts
export const existingOperation: ExistingOperationInterface = Object.freeze({
  execute: executeExistingOperation,
});
```

Avoid exported function declarations and avoid the public pattern `export const operation = (input: Input): Output => ...` when the operation is a runtime entrypoint that should be owned by an interface. Private implementation functions are acceptable; the public runtime seam is the explicitly typed interface object.

## ADT requirements for the final runtime path

- **Complete**: carries the typed source/AST/model evidence and exposes the operation that continues manifest construction.
- **Blocked**: carries the exact source/AST/read/parse failure evidence and exposes only operations valid for a blocked result (preserve/report/terminate), not a success continuation.
- **Inventory empty**: is a real domain state; it is not equivalent to source discovery failure, unreadable source, or AST failure.
- **Inventory populated**: owns ordering and source identity semantics; consumers should not rebuild those semantics with raw arrays or primitive checks.
- **Runtime operation**: `export const name: ExistingInterface = Object.freeze({...})`; no untyped public entrypoint and no exported `function` declaration on the audited production path.
- **No reasoning in consumers**: consumers provide next-step operations to a domain continuation; they do not decide what a source-selection state means.

## Verification plan

After implementation, run and report separately:

1. Focused source-selection tests: default optional missing files, explicit missing files blocked, multiple missing candidates, stable order and source identity.
2. Inventory tests: empty inventory, one entry, multiple entries, filtering, ordering, and read-plan result; verify there is no `void` visitor/no-op traversal left in the runtime contract.
3. AST/manifest boundary tests: read or parse failure remains blocked; empty successful source selection remains distinguishable from AST failure.
4. Structural audit: runtime CLI → manifest path contains no exported function declarations, entrypoints are interface-typed `export const` objects, public barrel exports the existing/evolved contracts, and `collections.ts` is zero bytes.
5. TypeScript typecheck, Vitest, package build, and CLI scan/sync E2E in a dependency-installed workspace. Do not infer these from syntax diagnostics or structural audit results.

## External language reference

TypeScript interfaces can describe named object contracts and callable operations, while discriminated unions model distinct result variants. The official handbook explains these mechanisms: https://www.typescriptlang.org/docs/handbook/2/objects and https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html.
