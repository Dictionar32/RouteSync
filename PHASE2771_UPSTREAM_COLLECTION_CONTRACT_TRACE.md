# Phase 2771 — Upstream collection contract trace

## Scope
Trace the upstream type contracts and runtime route from `packages/core/src/types/upstream` through source-AST production, completeness validation, source-model construction, manifest lowering and projection. This phase is an audit and remediation plan, not a claim that the collection representation has already been migrated.

## Runtime path

1. `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` produces `SourceDiscovery<T>` values from scanner results.
2. `packages/core/src/types/upstream/collections.ts` defines `SourceDiscovery<T>` as the `not_scanned | scanned` ADT, but its `scanned.items` payload is `readonly T[]`.
3. `packages/core/src/types/upstream/completeness.ts` validates scan completion; `ast.ts` carries `SourceAsts` and the complete-source wrapper.
4. `packages/core/src/types/upstream/highLevelSourceModel.ts` defines `SourceModelCatalog` fields as `Sequence<T>` and its builder converts discovery arrays using `sequenceAlgebra.fromArray`.
5. The same upstream area defines a separate `AstSequence<T>` in `ast.ts`, so there are multiple collection encodings in the type layer.
6. `routeManifestLowerer.ts` and `routeManifestProjectionInputs.ts` consume discovery and fail closed when `not_scanned` reaches manifest projection; this is preferable to silently translating a failed scan into an empty result.
7. CLI composition consumes the lowered `RouteManifest`; therefore a representation migration must update producer, upstream contract, source-model builder, manifest projection, CLI types, and tests together.

## Root cause
The root issue is not simply a helper or the removed `Discovered<T>` alias. The upstream contract currently mixes `readonly T[]`, `Sequence<T>`, and `AstSequence<T>`. `highLevelSourceModel.ts` explicitly bridges one representation into another. Replacing only the discovery payload with another container leaves this boundary conversion in place.

## Recommended remediation order

1. Decide and name one canonical collection representation for upstream domain data. Do not mechanically replace `Sequence<T>` with arrays or invent a generic wrapper that merely hides the same conversion.
2. Inventory every `Sequence<T>` and `AstSequence<T>` field in `collections.ts`, `ast.ts`, `highLevelSourceModel.ts`, and dependent domain types. Separate domain-level ADTs (which encode meaning) from generic storage containers (which only encode iteration).
3. Migrate one vertical slice first: scanner producer → `SourceDiscovery` → `CompleteSourceAst` → `SourceModelCatalog` → reference-index/contract projection → `RouteManifest` → CLI. Remove conversion adapters rather than renaming them.
4. Preserve scan-state distinction: `not_scanned` must never be treated as “scanned and empty”. Keep the fail-closed invariant at the complete-source boundary, and make the completed type exclude `not_scanned` statically where practical.
5. Convert exported function declarations on this runtime path to typed exported operation objects only where the API contract benefits from an object (`export const name: NameInterface = Object.freeze({ ... })`). Do not wrap trivial generic helpers in one-interface-per-helper abstractions.
6. Add compile-time tests for impossible states, runtime tests for empty/non-empty/completion-failure, and a CLI manifest integration test before claiming completion.

## Verification boundary
Run `npm run audit:phase2771-upstream-collection-contract-trace`. This is a source-structure audit only. It is not a whole-repository semantic typecheck, full test suite, build, or CLI end-to-end proof. The checks deliberately report remaining design debt rather than declaring it repaired.
