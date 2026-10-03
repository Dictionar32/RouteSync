# Phase 558 — Remaining Resolver Graph + Model/Domain Resolver Relational Cutover

## Architectural objective

Close the remaining semantic frontier after Phase 557 by moving resolver/model/domain decisions onto one declarative relation substrate:

`source evidence -> candidate relation -> witness -> projection -> rewrite -> recursive closure`

The cutover follows the higher-level direction used by declarative pattern/rewrite systems: MLIR PDL/PDLL represents matching and rewriting declaratively; its pattern infrastructure applies rewrites through a dedicated driver and can iterate to a fixed point. Flix treats relation and lattice constraints as first-class fixpoint computations. RouteSync now applies the same separation to its own resolver/model/domain pipeline rather than introducing another imperative resolver layer.

## Changed areas

- `compiler/domain/common/typeExpressionSemanticType.ts`
  - Sequence traversal is relation recursion.
  - Type-expression collections use relation projection.
- `compiler/domain/common/typeExpressionSemanticRelations.ts`
  - Projection catalogs are relation projections.
  - Witness selection uses relation-first/option folding.
- `compiler/domain/common/ResourceFieldFlattener.ts`
  - Nested resource traversal is recursive relation folding.
- `compiler/domain/common/ResponseFieldFlattener.ts`
  - Expression dispatch and nested flattening are relation-driven.
- `compiler/domain/common/ManifestArtifactLowerer.ts`
  - Resource/route candidate accumulation is relation folding.
  - Duplicate suppression is a relation gate.
- `compiler/domain/common/ResolvedObjectType.ts`
  - Property filtering/projection and object identity are relation-driven.
- `compiler/domain/common/resolved-types/compounds.ts`
  - Object identity selection is a relation catalog.
- `compiler/domain/common/semantic-resolver/compoundHandlers.ts`
  - Identity dispatch no longer uses a host Map/conditional chain.
- `compiler/domain/common/response-lowering/*`
  - Response conversion, partitioning, nullable-wrapper resolution, and semantic dispatch use relation projection/folding.
- `compiler/domain/common/ZodSchemaLowerer.ts`
  - Object/union/intersection lowering uses relation projection/folding.
- `compiler/domain/common/ArtifactContract.ts`
  - Artifact kind equality is relation-safe (`Object.is`).
- `compiler/domain/common/ConversionResult.ts`
  - Removes the host `never` sentinel from empty-field storage.
- `compiler/domain/common/FieldCollection.ts`
  - Collection transformation is relation projection.
- `compiler/semantic/plugins/method-return/selectRawProjectionParser.ts`
  - SQL projection optionality is modeled as RelationOption rather than host `null`.
  - Recursive top-level splitting remains relation-driven.
- `compiler/generators/contract-generation/response-field/types.ts`
  - `itemType` is structurally optional instead of carrying explicit `undefined` absence.

## Frontier audit

`audit-phase558-resolver-model-domain-frontier.cjs` scans 114 non-test TypeScript source files across:

- scanner resolvers
- model subscanner
- compiler domain/common
- semantic plugins

Result:

- `hostLeakCount = 0`
- `leakingFiles = []`
- `transpileDiagnosticsClean = true`
- `closedSurfaceClean = true`
- `modelEvidence = []`

The audit is TypeScript-AST based, so target-language literals such as PHP `null` strings are not confused with host `null` syntax.

## Verification limitation

Repository-wide `tsc --noEmit` remains unavailable in this checkpoint because the environment does not contain the declared `@types/node` and `vitest/globals` type-definition packages. Every file in the Phase 558 frontier is nevertheless independently transpile-checked by the audit.
