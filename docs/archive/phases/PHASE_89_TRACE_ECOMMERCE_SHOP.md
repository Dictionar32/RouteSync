# Phase 89 — ecommerce_shop Trace

## Origin
Laravel resource/model fields must carry semantic type at the scanner boundary.

## Finding
`ResourceFieldDescriptor` duplicated nullability as a boolean beside `semanticType`, allowing downstream code to reconstruct `NullableType` independently.

## Fix
- Removed `nullable` from `ResourceFieldDescriptor`.
- `ScannedResourceFieldDescriptor` now derives nullability only from `semanticType`.
- Resource expression mapping now returns `{ expression, semanticType }`.
- Nullsafe expressions encode nullability with `NullableType`.
- Response property processing consumes `field.semanticType` directly.
- Resource type derivation consumes verified `ResourceFieldDescriptor` directly.
- Removed resource semantic derivation's unknown-shape probing and type-string reclassification.

## Dataflow

Laravel PHP AST
→ verified resource expression
→ SemanticType
→ ResourceFieldDescriptor
→ resource ObjectType
→ RouteSync IR
→ lowerers

No second nullable channel exists on ResourceFieldDescriptor.
