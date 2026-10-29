# Phase 3089 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Status

**Runtime trace and migration-frontier audit completed; repository-wide export conversion is not complete.** This phase adds a reproducible lexical inventory and a path-specific review of the upstream → CLI → PHP source scanner → manifest → generator route. It does not claim a full typecheck or end-to-end pass.

## Runtime route and ownership

1. CLI entry points: `packages/cli/src/commands/scan.ts` and `packages/cli/src/commands/sync.ts`.
2. CLI scan operation: `packages/cli/src/manifestScanOperationInterface.ts`.
3. Runtime composition authority: `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`.
4. Upstream source-domain contracts: `packages/core/src/types/upstream/phpSourceFrontendInterface.ts`, `sourceProjectIdentity.ts`, and the upstream barrel.
5. Scanner wiring and Laravel source selection: `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts` and `packages/core/src/types/upstream/laravelRouteSourceSelection.ts`.
6. Semantic judgments, manifest builder, manifest projection/validation, and CLI output continue downstream from the composition authority.

The PHP/Laravel scanner must preserve source-file identity, source spans, fulfilled/rejected source-read evidence, blocker details, and the provenance of semantic judgments through manifest construction. A migration that merely renames a function or replaces a branch with a generic callback is not considered a model upgrade.

## Verified interface-first examples already on the runtime route

- `RouteSyncCliManifestScanOperationInterface` and its typed exported operation in `packages/cli/src/manifestScanOperationInterface.ts`.
- `ControllerInvocationManifestCompositionAuthorityInterface` and `controllerInvocationManifestCompositionAuthority` in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`.
- `PhpSourceTextFactoryInterface` and `phpSourceTextFactory` in `packages/core/src/types/upstream/phpSourceFrontendInterface.ts`.
- `ControllerSourceProjectIdentityCanonicalizationInterface` and the typed canonicalization judgment in `packages/core/src/types/upstream/sourceProjectIdentity.ts`.

These demonstrate `export const operation: OperationInterface = ...` on real runtime code, but do not establish repository-wide completion.

## Important unresolved contract

`PhpSourceDocumentReadOperationBatchJudgment` in `phpSourceFrontendInterface.ts` exposes a generic `continueWith<Result>` over fulfilled/rejected handlers. Its consumer in `controllerInvocationManifestComposition.ts` uses that continuation to route rejection evidence to the manifest terminal or fulfilled reads into identity binding. The contract is executable and preserves the two outcomes, but it remains a generic continuation surface rather than a closed, domain-specific next-operation interface. A safe replacement must retain both branches' full evidence and avoid making `core` depend on CLI manifest types. Do not replace it mechanically with a generic visitor/fold under a different name.

## Repository-wide export migration inventory

The companion script `scripts/audits/audit-phase3089-fully-explicit-runtime-scanner-operations.cjs` performs a lexical scan of TypeScript source files under `packages/core/src`, `packages/cli/src`, `packages/sdk/src`, and `packages/react/src`. The current scan is a review inventory, not a TypeScript AST transform. It identifies exported function declarations and exported arrow-function constants for domain-by-domain migration.

The previous Phase 3086 inventory recorded 520 `export function` declarations and 335 exported arrow constants across its scan scope. The new script computes fresh counts from the current workspace and should be treated as authoritative for its stated roots; differences from previous inventories can result from scan scope or matcher changes. No claim is made that all candidates have been converted in this phase.

## Rules for the next migration

1. Start from real runtime imports and callers; group candidates by domain ownership.
2. Define the domain input, result ADT, evidence/provenance, and domain operation before changing exports.
3. Prefer `export const operation: OperationInterface = Object.freeze({ ... })` where the export is genuinely an operation object. Update callers and re-exports in the same migration.
4. Preserve legitimate domain primitives and collection semantics when they carry real information. Do not delete `string`, `number`, `undefined`, `null`, `boolean`, arrays, `??`, ternaries, `if`, `===`, `is`, `as`, `lookup`, `void`, visitors, `switch`, loops, `map`, or `reduce` by text replacement. Instead, eliminate each only where an explicit higher-level model can preserve the exact semantics and type information.
5. Keep lexer/parser mechanics separate from semantic knowledge. A scanner's bounded token traversal is not equivalent to domain control flow; encapsulate syntax navigation behind a syntax model where it removes leaked traversal arithmetic without erasing source offsets or order.
6. Do not restore deleted relation foundation modules: `relationMembership`, `relationalSequence`, or `semanticRelations`.
7. Verify each batch with typecheck, relevant tests, export/import compatibility checks, and end-to-end PHP source → CLI → manifest → generator checks before calling it complete.

## Validation limits

- This phase's lexical inventory is not a compiler-backed AST analysis.
- Full repository typecheck is not claimed.
- Full test suite and end-to-end PHP → CLI → manifest → generator verification are not claimed.
- Repository-wide conversion remains open.
