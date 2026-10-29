# Phase 2775 — Upstream ADT Runtime Trace and Recommendations

## Scope and status

This trace is based on the current workspace after `packages/core/src/types/upstream/collections.ts` was emptied (0 bytes). It maps the scanner-to-CLI manifest path and identifies the ADT/contract consequences. It is a source trace, not a claim that the repository currently typechecks.

## Runtime trace

1. **Scanner producer** — `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`
   - `laravelSourceAstPipelineFactory.create(...).execute()` orchestrates the scanners.
   - `scanned(items)` creates the `SourceDiscovery<T>` arm `{ kind: "scanned", items: Object.freeze([...items]) }`.
   - categories that cannot be asserted as scanned are represented as `{ kind: 'not_scanned' }`.
   - the pipeline assembles the source AST and calls `validateCompleteSourceAst(ast, sourceProject.source)`.
   - result is either `laravel_source_ast_projection_complete` or `laravel_source_ast_projection_blocked`.

2. **Completeness boundary** — `packages/core/src/types/upstream/completeness.ts` and `packages/core/src/types/upstream/ast.ts`
   - completion is a gate before source-model construction; it should not turn an unscanned category into an empty collection.
   - AST uses explicit domain variants, but `ast.ts` currently imports `SourceAsts` from `./collections` and defines `AstSequence<T>` for multiple AST evidence/constraint/diagnostic/proof collections.

3. **Source-model / manifest builder** — `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` and `packages/core/src/types/upstream/highLevelSourceModel.ts`
   - `manifestBuilderOperationPreparation.prepare(input).build()` awaits the AST pipeline.
   - a blocked AST yields `manifest_builder_blocked` at `source_ast`; source-model failure yields `manifest_builder_blocked` at `source_model`.
   - on success it builds the semantic source model and returns `manifest_builder_complete` containing `RouteSyncManifest`.
   - `SourceModelCatalog` still refers to `Sequence<T>`, and `completeItems()` calls `sourceDiscoveryMatcher` then converts scanned arrays through `sequenceAlgebra.fromArray(...)`. Those names were defined in `collections.ts`, which is now empty, so these imports/types/values are unresolved unless their ownership is migrated elsewhere.

4. **Manifest lowering** — `packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts`
   - `routeSyncManifestLoweringOperations.lower(...)` projects route flows, models, resources, and channels.
   - `discoveredItems(...)` rejects `not_scanned` by throwing; this is fail-closed, but it is not an ADT result at this boundary. Prefer returning a typed `manifest_lowering_blocked` judgment rather than using an exception for an expected domain state.

5. **Manifest projection** — `packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts`
   - projection is represented as `manifest_projected | manifest_projection_blocked` and exhaustively switches on the derivation result.
   - this is an existing good ADT pattern to align the other boundaries with.

6. **CLI scan/composition** — `packages/cli/src/manifestScanOperationInterface.ts`, `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`, and `packages/cli/src/upstreamCompositionFactory.ts`
   - CLI scan is exposed through the typed `routeSyncCliManifestScanOperationFactory` object, delegating to an explicit composition authority.
   - keep this boundary as an operation object, and propagate blocked judgments without fallback to empty data.

7. **CLI manifest validation, serialization, persistence** — `packages/cli/src/generators/ManifestGenerator.ts` and `packages/cli/src/generators/ManifestSerializer.ts`
   - validation and serialization use discriminated judgments and exhaustive `never` checks.
   - persistence has separate contract-rejected, serialization-rejected, write-rejected, and complete outcomes. The catch around optional prior frontend/page state is intentionally a separate best-effort merge path, not scanner completeness.

## Root-cause assessment after emptying `collections.ts`

The file is empty, but its consumers have not yet been migrated. The current tree still contains imports/references for `Sequence`, `Lookup`, `SourceDiscovery`, `SourceAsts`, named aliases, `matchLookup`, `sequenceAlgebra`, and `sourceDiscoveryMatcher`. `ast.ts`, `highLevelSourceModel.ts`, scanner wiring, semantic producers, and analysis projections depend on some of those symbols. Therefore the workspace is intentionally in an intermediate, likely non-typechecking state; this report does not claim build or tests pass.

## ADT recommendation

Do not recreate a generic collection abstraction under a new name. First classify each remaining `collections.ts` export by responsibility:

- **Domain state**: keep explicit tagged unions where variants carry meaning (`not_scanned`, `scanned`, `blocked`, `complete`, `ambiguous`, `rejected`).
- **Collection-shaped payloads**: use the native representation already required at each domain boundary, without wrapping every list in a generic recursive `Sequence`/`AstSequence` encoding. Do not conflate a successfully scanned empty list with `not_scanned`.
- **Lookup/matching**: move domain-specific matching to the owning domain contract, or use local exhaustive switches where that is clearer. Do not rebuild a generic collection library just to restore imports.
- **Runtime operations**: on the runtime path, expose cohesive operations as `export const operation: OperationInterface = Object.freeze({...})`. Keep tiny generic helpers private; avoid one interface per helper.
- **Expected failures**: return closed ADT judgments (`*_complete | *_blocked` or `*_accepted | *_rejected`) for expected domain outcomes; reserve thrown exceptions for genuinely exceptional/unrecoverable faults.
- **Exhaustiveness**: use discriminants and `never` checks at scanner, completeness, source model, manifest lowering, serializer, and CLI dispatch boundaries.

## Migration order

1. Inventory exports formerly owned by `collections.ts` and group by domain owner.
2. Migrate `SourceDiscovery`/`SourceAsts` and completeness first, because these define the scanner's completeness gate.
3. Migrate `ast.ts` away from `AstSequence` and all dependent constructors/traversals as a single AST vertical slice.
4. Migrate semantic producers and analysis projections; remove `Sequence`-specific recursive traversal helpers.
5. Migrate `highLevelSourceModel.ts` and remove `completeItems`/`sequenceAlgebra` conversions.
6. Change manifest lowering from exception-based `not_scanned` rejection to typed blocked judgment, then wire that ADT through projection and CLI.
7. Update exports and tests, run typecheck, focused tests, full tests, build, and CLI end-to-end in that order.

## Official references

- TypeScript Handbook — [Unions and Intersection Types](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html): discriminated unions and exhaustive checking.
- TypeScript Handbook — [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html): discriminants, narrowing, and `never`-based exhaustiveness.
- TypeScript Handbook — [Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html): structural contracts, readonly fields, and function call signatures.
