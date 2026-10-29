# Phase 2770 — Upstream Source-Discovery Contract Trace and Repair Recommendation

## Scope

Trace the source-category discovery contract from scanner production through source-AST completeness validation, manifest construction, source-model construction, and CLI-facing manifest projection. This phase repairs the concrete fail-open behavior at the downstream boundary and records the remaining upstream contract mismatch; it does not claim to remove every array or `Sequence` use from the repository.

## Runtime trace

1. `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`
   - `scanned(items)` constructs `SourceDiscovery<T>` as `{ kind: 'scanned', items: Object.freeze([...items]) }`.
   - A category whose authoritative scan cannot complete (currently controller declaration selection) is represented as `{ kind: 'not_scanned' }`.
2. `packages/core/src/types/upstream/collections.ts`
   - `SourceDiscovery<T>` is the shared status contract: `not_scanned` or `scanned` with `readonly T[]`.
   - It currently couples discovery status to a raw array collection representation.
3. `packages/core/src/types/upstream/completeness.ts`
   - `validateCompleteSourceAst` checks every required category and returns either a branded `CompleteSourceAst` or `IncompleteUpstream`.
   - The runtime completeness gate is sound in intent, but the static `CompleteSourceAst.ast` currently retains the broad `SourceAsts` field types. TypeScript therefore still allows consumers of a supposedly complete AST to see `not_scanned`.
4. `packages/core/src/types/upstream/manifest.ts`
   - `RouteSyncManifest.ast` is `CompleteSourceAst`, so downstream projection is meant to consume only a validated complete AST.
5. `packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts` and `routeManifestProjectionInputs.ts`
   - Both previously converted `not_scanned` into `Object.freeze([])`. This was fail-open: an upstream completeness violation was silently reinterpreted as a successful scan with zero results.
   - Phase 2770 removes that fallback. These boundaries now fail immediately with a category-specific invariant error instead of fabricating an empty collection.
6. `packages/core/src/types/upstream/highLevelSourceModel.ts`
   - `buildCompleteLaravelSourceModel` converts scanned discovery items into `Sequence<T>` via `completeItems`, then builds `SourceModelCatalog` fields as `Sequence<...>`.
   - This is a separate contract mismatch: source discovery uses raw arrays while the semantic source-model catalog uses `Sequence`. It causes representation conversion rather than preserving one canonical upstream collection contract.

## Root cause

There are two related defects, not one helper defect:

- **Fail-open completeness boundary:** `not_scanned` was projected to an empty array in manifest consumers, masking an upstream completeness failure.
- **Split collection representation in core upstream:** `SourceDiscovery<T>` carries `readonly T[]`, while `SourceModelCatalog` and much of the semantic model use `Sequence<T>`. `buildCompleteLaravelSourceModel` bridges the mismatch by converting one representation to the other.

Removing `Discovered<T>`, `sequenceToArray`, or a single conversion helper does not resolve the second defect. Renaming `Sequence` or introducing another generic list wrapper would only relocate it.

## Recommendation for the next source-level change

1. **Refine completeness in the type system.** Define a `CompleteSourceAsts` view whose category fields statically require the `scanned` variant. Make `validateCompleteSourceAst` the only authority that can produce that refined type. Then lowerers can consume category items without a `not_scanned` fallback or an invariant throw.
2. **Choose one canonical upstream collection model before changing call sites.** The requested constraint is neither raw `T[]` nor `Sequence<T>`. Trace the actual collection consumers in `highLevelSourceModel.ts`, `semanticReferences.ts`, `controllerActionPolicyRelations.ts`, and downstream projections; determine which require source order, identity lookup, or multiplicity. Model those semantics explicitly at the domain boundary rather than introducing a renamed generic sequence.
3. **Migrate producer and consumer together.** The scanner/pipeline, completeness validator, `SourceAsts`, `CompleteSourceAst`, source-model builder/catalog, and manifest projection must share the same contract. Do not adapt back to arrays or `Sequence` at intermediate boundaries.
4. **Acceptance criteria:** no `not_scanned -> empty` conversion; no array/`Sequence` round-trip in the source-model path; explicit typed incomplete-upstream result; tests cover every source category, including a deliberately unscanned category; run semantic typecheck and manifest/CLI integration tests before claiming closure.

## Phase 2770 change

Both manifest projection boundaries now throw a category-specific invariant error if a `CompleteSourceAst` unexpectedly contains `not_scanned`. This removes the silent fallback and exposes the broken invariant. It is a fail-closed repair, not the final collection-model migration. `SourceDiscovery<T>` still declares `readonly T[]`, and `SourceModelCatalog` still declares `Sequence<T>`; these are explicitly outstanding.
