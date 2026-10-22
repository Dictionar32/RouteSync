# Phase 2469 — Model Schema Lookup Upstream Authority

## Baseline and constraints

- Baseline chain: Phase2466 → Phase2467 → Phase2468 (`RouteSync-Phase2468-Laravel-Model-Key-Upstream-Authority.zip`).
- No files were moved and the existing `subscanners/model` directory remains in place.
- This phase closes one concrete ownership gap; it does not claim the full Laravel scanner is free of relation/foundation imports.

## Audit and trace

`packages/core/src/compiler/scanner/subscanners/model/columnInferrer.ts` previously implemented schema-table lookup using `relationGate`, `relationEqual`, `relationOptionFold`, `relationSome`, and `relationNone`. The lookup's meaning—whether a schema contains the model's selected table—was implicit in a scanner helper and coupled to `semantic/relations`.

The upstream schema already provides a closed `SchemaInterface`, `SchemaTable`, `TableName`, and sequence ADT. The missing contract was a named, closed judgment for the lookup outcome.

## Changes

- Added `ModelSchemaLookupEvidence`, `ModelSchemaLookupJudgment`, and `ModelSchemaLookupAuthorityInterface` under `types/upstream`.
- Added `modelSchemaLookupAuthority`, exported as `export const modelSchemaLookupAuthority: ModelSchemaLookupAuthorityInterface = Object.freeze(...)`.
- The closed judgment distinguishes `resolved_model_schema_table` from `missing_model_schema_table`.
- Wired `subscanners/model/columnInferrer.ts` to the upstream authority; removed its `semantic/relations` and `semantic/foundation` imports.
- Changed the two exported column/schema operations from `export function` declarations to `export const ...: Interface` boundaries.
- Added audit and smoke scripts; added npm script entries. No files moved.

## Validation

- Phase2467 audit 13/13 and smoke 7/7 passed.
- Phase2468 audit 10/10 and smoke 6/6 passed.
- Phase2469 audit 10/10 passed.
- Phase2469 authority smoke 2/2 passed.
- Full package typecheck, full Vitest, package build, and end-to-end CLI were not run.

## Remaining work (explicit)

The model subscanner still has direct `semantic/relations` imports in `modelParser.ts`, `modelCanonical.ts`, `propertyProducer.ts`, and `semanticTypeCanonical.ts`; these remain unresolved. The wider scanner tree still contains relation imports, and the `subscanners` tree has not been retired. The model subdirectory has no direct `semantic/foundation` import in the audited Phase2468 baseline, but that is not proof that all scanner dependencies are foundation-free.

Next, trace the existing upstream model semantic/AST contracts and migrate the remaining relation-dependent responsibilities into those actual owners, reusing existing contracts where adequate. Do not solve this by moving files or by creating disconnected duplicate interfaces.
