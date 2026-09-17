# Interface Trace Audit — Phase 87.24

## Scope

Tighten the `BoundSemanticFactory` boundary so the factory cannot silently convert raw strings, booleans, optional values, or legacy fallback payloads into semantic ADTs.

## Trace

`Laravel AST → FieldNode → model/resource symbol → semantic resolver → BoundSemanticFactory → BoundSemanticNode → lowerer`

The previous factory was still a second semantic classifier. It accepted `string | PrimitiveKind | SemanticType`, optional literal values, raw model/column/relation/method names, raw condition strings, raw operators, optional nullability, and legacy `unknown(...)` arguments. That allowed semantic meaning to be reconstructed at the point where the Bound AST should already be fully typed.

## Repairs

- `primitive()` now requires `SemanticType` and `BoundLiteralValue`.
- `modelColumn()` now requires `ModelName`, `ColumnName`, `DatabaseTypeName`, `BoundCastType`, and `SemanticType`.
- `relation()` now requires qualified model/relation names and explicit `BoundNullability`.
- `propertyChain()` now requires qualified root model, semantic type, and explicit nullability.
- `conditional()` now requires `ConditionExpression`, `BoundTargetModel`, and `SemanticType`.
- `binary()` now requires `SemanticOperator` and `SemanticType`.
- `ternary()` now requires `ConditionExpression` and `SemanticType`.
- `methodCall()` now requires `BoundTargetModel`, `MethodName`, `SemanticType`, cardinality, and nullability.
- `unknown()` was removed as a factory operation. Unsupported meaning must use `unsupported(BoundUnsupportedReason)`.
- `matchBoundSemantic()` remains exhaustive via `switch`.
- Resource binder legacy `unknown(...)` calls were migrated to `unsupported(...)`.

## Intentional compile surface

Existing semantic resolver call sites still pass legacy `SemanticResolution.type: string` and raw model/property names. Those are intentionally exposed as compile-time migration points rather than hidden by factory coercion.

Next upstream repair should qualify `SemanticResolution` and resolver outputs before adapting the remaining factory call sites. Do not restore compatibility overloads or fallback coercion in `BoundSemanticFactory`.

## Verification

- ZIP source was extracted from Phase 87.23.
- Source modifications were applied directly to the extracted repository.
- Full TypeScript/Vitest validation was not available because the snapshot has no installed `node_modules` toolchain.
