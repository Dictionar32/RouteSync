# Interface Trace Audit - Phase 87.25

## Target
Migrate remaining BoundSemanticFactory consumers away from free semantic strings and fake primitive fallback nodes.

## Repairs
- Removed `BoundSemanticFactory.primitive(resolution.type)` fallback from conditional and binary resolution paths.
- Missing semantic Bound AST now becomes explicit `bound_unsupported` rather than fabricating a primitive value that never existed in the PHP expression.
- Added `SemanticValueFactory` as the explicit boundary for ModelName, ColumnName, RelationName, DatabaseTypeName, ConditionExpression, and SemanticOperator.
- Migrated whenLoaded and resource relation binders to the strict BoundSemanticFactory contract.
- Removed the invalid `invalidationTags` argument from nested property-chain construction.
- Nested arrays without a model origin now produce `invalid_boundary_input` instead of inventing a model name.

## Important remaining upstream issue
`SemanticResolution` still contains legacy free-form fields (`type: string`, optional model/resource/collection/nullable). The next phase should replace that porous shape with a closed ADT and migrate resolver plugins to return it directly.

## Validation
The snapshot has no installed node_modules, so TypeScript/Vitest execution is not claimed. Structural grep and source inspection were used.
