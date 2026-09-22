# Interface Trace Audit - Phase 77

## Scope
Interface/ADT only. Producer, scanner, generator, and consumer flow are intentionally not migrated.

## Trace finding
The generated `frontend/api` output consumes information that already exists as resource-field semantics: source response field, generated target property, semantic type, nested expression, model/resource reference, cardinality, and nullability.

The previous interface represented several of these values as naked strings or booleans. That allows a canonical manifest object to carry data whose meaning is only understood by the generator.

## Repair
- `ResourceFieldDescriptor.name` -> `ResponseFieldName`
- `ResourceFieldDescriptor.propertyName` -> `PropertyName`
- model/resource references -> `ModelName` / `ResourceName`
- response type identity -> `ResponseTypeName`
- type casts -> `CastTypeName`
- binary operators -> `SemanticOperator`
- cardinality -> explicit `single | collection` ADT
- assignment nullability -> existing `Nullability` ADT
- added `ResourceName`, `ResponseTypeName`, `ResponseFieldName` semantic value objects

## Dataflow invariant
Laravel AST -> semantic ADT -> manifest -> generator.

The generator must consume these values and construct source code. It must not re-classify or rediscover their meaning.

## Deferred
Existing factories and flow still construct the legacy primitive shapes. They are deliberately not changed in this phase. Expected compiler failures are evidence for the next producer migration phase.
