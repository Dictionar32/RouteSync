# Interface Trace Audit - Phase 65

## Scope

Interface/ADT only. Producer, scanner, resolver, lowerer, and emitter flow are intentionally not migrated in this phase.

## Trace finding

The previous Bound Semantic AST had semantic fields typed directly as primitive JavaScript values:

- model, sourceModel, targetModel -> `string`
- column/property/relation/method names -> `string`
- database/cast type names -> `string`
- condition expressions -> `string`
- binary operator -> `string`
- primitive literal -> `string | number | boolean | null`

Those types are syntactically valid but semantically unqualified. A downstream consumer could pass the wrong string into the wrong field and the compiler would accept it. That is the definition of a free-data boundary.

## Repair

Added `semanticValues.ts` with closed semantic value objects:

- `ModelName`
- `ColumnName`
- `PropertyName`
- `RelationName`
- `MethodName`
- `ConditionExpression`
- `DatabaseTypeName`
- `CastTypeName`
- `SemanticOperator`
- `BoundLiteralValue`

`boundAst.ts` now consumes these semantic types instead of naked primitives for semantic identity and expression roles.

## Invariant

After this phase, a Bound Semantic AST node carries meaning in its type. A downstream stage cannot silently substitute a column name where a model name is required, nor invent an arbitrary binary operator.

## Intentionally deferred

Existing producers and consumers still construct the previous primitive shapes. They are expected to fail type-checking until the next migration phase. This is intentional: interface tightening must expose missing upstream contracts instead of hiding them with coercion, fallback, `any`, or reclassification.
