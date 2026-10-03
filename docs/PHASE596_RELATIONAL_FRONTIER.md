# Phase 596 — Relational Frontier Cutover

## Scope

This phase continues the RouteSync semantic cutover from Phase 595. The concrete target was the remaining constructor/state authority around semantic types, analysis storage, analysis dependency graphs, and selected scanner resolvers.

The implementation follows the same declarative direction as Soufflé relations/rules, MLIR declarative rewrites, egglog's Datalog + equality-saturation model, Statix-style relation-based name resolution, WebAssembly's declarative typing judgements, and CompCert's explicit semantic relations/preservation boundary.

## Research basis

- Soufflé models relations as typed sets of tuples and rules as Horn clauses that derive relation facts.
- MLIR PDLL represents pattern matching and rewriting declaratively rather than as imperative transformation code.
- egglog combines equality saturation and Datalog, making relational facts and rewrite saturation a natural shared substrate.
- WebAssembly 3.0 defines validity through declarative typing rules over abstract syntax and contexts.
- CompCert treats compiler correctness as a semantic-preservation relation between source and generated code.
- CIRCT uses a canonical MLIR-based IR as the central hinge between frontends and progressive lowering.

## Changes

### Semantic type algebra

`packages/core/src/compiler/types/SemanticType.ts` no longer contains the semantic type class hierarchy. The semantic type vocabulary is now structural:

```text
kind relation + immutable payload + visitor witness
```

The former class names remain callable factory functions for source compatibility, but the implementation emits frozen structural witnesses and contains no host `new` expression. `ReferenceType.model/resource/response/plain`, `UnionType.of`, `IntersectionType.of`, `ObjectType.create/empty`, and `ScannedObjectProperty.create` are factory projections over the same witness algebra.

All production call sites that previously instantiated the semantic type classes were migrated to factory calls. A production scan reports zero semantic-type constructor expressions.

### Analysis storage

- `PassAnalysisStore` now stores registry facts in `RelationIndex` tuples and returns `RelationOption` rather than `undefined`.
- `AnalysisDependencyGraph` now uses relation-backed adjacency facts instead of `Map`/`Set` state.
- `AnalysisManager` now exposes an immutable relation closure for dependent discovery and relation-backed invalidation.
- `UseDefGraph` now stores definition/use facts as relations rather than host `Map`/`Set` collections.

### Resolver cutover

- `RouteSecurityResolver` is now an immutable resolver witness rather than a class with static authority.
- `ResourceModelResolver` is now a prioritized relation resolver witness; candidate selection remains an explicit ordered relation fold.
- `typeExpressionSemanticRelations.ts` no longer constructs host `Error` objects with `new`.
- Deprecated `relationIndexValue` was removed so the relation kernel no longer exposes a `void 0` absence escape hatch.

### Dead-file vacuum

Removed two genuinely empty, non-production artifacts:

- `compiler/scanner/upstream/routeAstConstruction.ts`
- `compiler/scanner/descriptors/model/entity/types.ts`

The remaining zero-byte scanner files were retained where legacy tests or import surfaces still reference them; they were not deleted blindly.

## Audit

`docs/PHASE596_RELATIONAL_FRONTIER_AUDIT.json` is generated from the TypeScript AST and excludes test/spec files. It distinguishes actual AST constructs from source-language vocabulary strings.

The following selected production files are at zero for all audited host constructs:

- `compiler/types/SemanticType.ts`
- `compiler/analysis/AnalysisManager.ts`
- `compiler/analysis/PassAnalysisStore.ts`
- `compiler/analysis/UseDefAnalysis.ts`
- `compiler/analysis/manager/dependencyGraph.ts`
- `compiler/scanner/resolvers/RouteSecurityResolver.ts`
- `compiler/scanner/resolvers/resource/ResourceModelResolver.ts`
- `compiler/domain/common/typeExpressionSemanticRelations.ts`
- `semantic/kernel/relationMembership.ts`

Repository-wide production residuals remain and are intentionally not claimed clean. The current largest frontier is now the remaining analysis algorithms, upstream/domain data-model option fields, semantic lowering, and scanner descriptor factories.

## Validation

All modified production files pass TypeScript parser/transpile validation with zero diagnostics.

A repository-wide `npx tsc --noEmit --skipLibCheck --pretty false` remains blocked before project checking because the workspace does not contain the configured `node` and `vitest/globals` type definition packages:

```text
TS2688 Cannot find type definition file for 'node'.
TS2688 Cannot find type definition file for 'vitest/globals'.
```

Therefore this phase does not claim a full repository typecheck.
