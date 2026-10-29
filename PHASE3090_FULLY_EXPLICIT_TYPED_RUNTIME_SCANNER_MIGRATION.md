# Phase 3090 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Status

This phase carries forward the actual Phase 3089 workspace, reruns its lexical export inventory, and records a migration frontier tied to the real CLI → upstream source scan → semantic manifest composition path. It does **not** claim repository-wide conversion is complete. No broad text-rewrite was applied because it would change semantics without resolving domain ownership or callers.

## Fresh inventory

Scope: `packages/core/src`, `packages/cli/src`, `packages/sdk/src`, `packages/react/src`.

- Exported function declarations: **365 across 165 files**.
- Exported arrow-function constants: **70 across 41 files**.
- Total lexical candidates: **435 declaration occurrences**. File sets overlap, so do not sum file counts.
- Inventory method: lexical scanner, not compiler-backed TypeScript AST analysis.

Machine-readable evidence is in `reports/PHASE3090_RUNTIME_EXPORT_INVENTORY.json`; full per-file candidate list is in `reports/PHASE3090_EXPORT_MIGRATION_FRONTIER.csv`.

## Runtime route (source-grounded)

1. CLI entry: `packages/cli/src/commands/scan.ts` / `sync.ts`.
2. CLI operation contract: `packages/cli/src/manifestScanOperationInterface.ts`.
3. Composition authority: `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`.
4. Upstream source domain: `packages/core/src/types/upstream/phpSourceFrontendInterface.ts`, `sourceProjectIdentity.ts`, and the upstream barrel.
5. Laravel discovery/wiring: `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts` and `packages/core/src/types/upstream/laravelRouteSourceSelection.ts`.
6. Semantic judgment preparation → manifest build/projection/validation → CLI generator output.

Preserve source identity, source spans, read order, fulfilled/rejected read evidence, blocker payload, and semantic provenance across this route.

## Interface-first examples already on the runtime route

- `RouteSyncCliManifestScanOperationInterface` → typed exported operation in `packages/cli/src/manifestScanOperationInterface.ts`.
- `ControllerInvocationManifestCompositionAuthorityInterface` → `controllerInvocationManifestCompositionAuthority` in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`.
- `PhpSourceTextFactoryInterface` → `phpSourceTextFactory` in `packages/core/src/types/upstream/phpSourceFrontendInterface.ts`.
- `ControllerSourceProjectIdentityCanonicalizationInterface` → typed canonicalization operation in `packages/core/src/types/upstream/sourceProjectIdentity.ts`.

These are real interface-typed operation objects, not proof that all other exports are migrated.

## Domain-model frontier

`PhpSourceDocumentReadOperationBatchJudgment` in `phpSourceFrontendInterface.ts` is still a fulfilled/rejected ADT whose variants expose `continueWith<Result>`. Its CLI consumer uses the fulfilled branch to bind source identity and route rejected evidence into a manifest terminal. Replacing this generic continuation safely requires a source-domain operation contract that retains both evidence paths and does not make `core` depend on CLI manifest types. Renaming it to a generic visitor/fold is not an acceptable model upgrade.

Other repository candidates must be grouped by domain ownership and caller graph before conversion. Not every exported function is a domain operation object: pure predicates, compiler primitives, public callbacks, type guards, recursive algorithms, and package API functions need individually appropriate contracts.

## Migration policy

Target form where semantically appropriate:

```ts
export interface SourceOperationInterface {
  readonly execute: (input: SourceOperationInput) => SourceOperationResult;
}

export const sourceOperation: SourceOperationInterface = Object.freeze({
  execute: input => sourceDomainAuthority.execute(input),
});
```

Do not apply a blind replacement to `string`, `number`, `undefined`, `null`, `boolean`, arrays, `??`, ternaries, `if`, `:`, `===`, `is`, `as`, `lookup`, `void`, visitors, `switch`, loops, `map`, or `reduce`. Each may encode valid type information, language semantics, parser mechanics, or collection ordering. Remove or encapsulate a construct only when a typed domain model preserves its semantics and evidence.

Do not restore `relationMembership`, `relationalSequence`, or `semanticRelations` under `packages/core/src/semantic/relations/`.

## Validation

- The Phase 3089 lexical inventory script ran successfully and reported 365 + 70 candidates.
- No claim of full TypeScript typecheck, full tests, or PHP → CLI → manifest → generator end-to-end success is made by this phase.
- Repository-wide export conversion remains open.

## Recommended next implementation batch

1. Trace imports and callers for the 435 candidates; start with the runtime-route files above.
2. Define the domain input, closed result ADT, evidence/provenance, and domain-owned follow-up operation.
3. Migrate producer and all consumers/re-exports together.
4. Verify typecheck, focused tests, public export compatibility, and a Laravel/PHP scanner-to-manifest E2E case.
5. Repeat per domain instead of converting unrelated exports in one mass rewrite.
