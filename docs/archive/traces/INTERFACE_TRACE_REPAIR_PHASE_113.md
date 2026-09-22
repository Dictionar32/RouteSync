# RouteSync Interface Trace & Repair Phase 113

## Boundary repaired
`BoundSemanticNode -> ObjectProperty` now preserves an explicit `ObjectPropertyOrigin`.

## ObjectPropertyOrigin
Closed ADT variants:
- `bound_expression`: retains the complete bound semantic node, including property-chain origin and step metadata.
- `model_column`: retains model + property.
- `model_accessor`: retains model + property.
- `query_projection`: retains model + projected response field.
- `validation_field`: retains validation field origin.
- `derived`: explicitly marks semantic/nested-object derivation.

## Resource field boundary
`ResourceFieldDescriptor.semantic` remains the canonical semantic boundary. Its `boundAst` view is non-optional and derived from that semantic value.

## Loss prevented
A resource property no longer crosses into `ObjectProperty` as only `name/type/required/description`. The origin binding travels with it, so downstream can inspect the source model/property path and binding semantics without re-classification.

## Remaining migration
`MappedResourceExpression` and some legacy `semanticType` accessors still exist as compatibility views. They are not the final SSOT shape and should be migrated in a subsequent interface pass.
