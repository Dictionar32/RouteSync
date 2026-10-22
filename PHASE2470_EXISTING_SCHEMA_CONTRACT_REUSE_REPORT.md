# RouteSync Phase2470 — Existing Schema Contract Reuse and Model Scanner Boundary Audit

## Baseline and scope

- Baseline: Phase2469 ZIP, itself derived from the Phase2466 lineage.
- No source files were moved.
- Goal: correct the duplicate schema lookup abstraction introduced in Phase2469 and use the existing upstream schema relation index contract.

## Root cause

Phase2469 introduced `ModelSchemaLookupAuthorityInterface` and `modelSchemaLookupAuthority`, which repeated table lookup over `SchemaInterface.definition.tables`. That created a parallel model-specific lookup authority even though upstream already had `SchemaRelationIndexInterface` and `schemaRelationIndexFrom`.

## Changes

1. Evolved the existing `SchemaRelationIndexInterface` with `schemaTable(table: TableName): SchemaTable | undefined`.
2. Implemented `schemaTable` inside the existing `schemaRelationIndexFrom` producer.
3. Rewired `columnInferrer.ts` to call `schemaRelationIndexFrom(schema).schemaTable(table)`.
4. Removed the duplicate `ModelSchemaLookupAuthorityInterface`, authority implementation, barrel exports, and Phase2469 audit/smoke commands. Historical Phase2469 report remains as historical evidence; this phase supersedes its duplicate-authority implementation.
5. Converted four exported model operations to `export const name: Interface`: `correlateModelColumnFacts`, `buildModelColumnFacts`, `modelAstFromSemantic`, and `parseModelPropertyAsts`.
6. Added Phase2470 audit and smoke checks.

## Verification evidence

- Phase2470 audit: 10/10 passed.
- Phase2470 smoke: 3/3 passed.
- Phase2467 audit: 13/13 passed.
- Phase2467 smoke: 7/7 passed.
- Phase2468 audit: 10/10 passed.
- Phase2468 smoke: 6/6 passed.
- TypeScript syntax transpilation for six changed TypeScript files: 6/6 passed.
- `packages/core/package.json` parsed successfully.
- ZIP integrity verified after packaging.

## Remaining work (not claimed as complete)

- Four model-scanner files still import `semantic/relations`: `propertyProducer.ts`, `modelCanonical.ts`, `semanticTypeCanonical.ts`, and `modelParser.ts`.
- No direct `semantic/foundation` imports were found in the scanned `subscanners` tree.
- Across the broader `subscanners` tree, 40 files still contain direct `semantic/relations` imports. This phase does not claim the full `subscanners` migration is complete.
- The four remaining model relation imports need per-operation tracing against existing upstream owners before deciding whether to reuse/evolve an existing contract or eliminate a dependency. Do not create replacement abstractions without evidence of a missing contract.
- Full package typecheck, complete Vitest suite, package build, and end-to-end CLI were not run.
