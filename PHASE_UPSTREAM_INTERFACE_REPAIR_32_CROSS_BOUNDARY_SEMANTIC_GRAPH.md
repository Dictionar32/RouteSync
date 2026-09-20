# Phase Upstream Interface Repair 32 — Cross-Boundary Semantic Graph

## Scope
Interface-first only. Downstream implementation was intentionally not repaired.

## Trace
The cross-boundary trace found that several consumers would need to reconstruct relationships from primitive names or parallel collections:
- model column + separate cast collection
- resource model name + response type name
- route controller name + action name
- controller resource name + model origin
- source model reference index as independent name sequences

## Repairs
### Model
`ModelSurfaceFacts` now treats `ModelColumnFact.cast` as the canonical cast relationship attached to the column. The separate `ModelCastFact` collection was removed from the high-level surface interface so consumers cannot require a second lookup to determine a column's effective cast.

### Semantic references
Added typed `ControllerReference` and `SemanticRelation` / `SemanticRelationGraph` vocabulary. Relations now explicitly represent resource→model, request→property, response→resource, response→model, route→request, route→response, and route→controller relationships.

### Resource
`ResourceDefinition.model` is now `ModelReference` and `ResourceDefinition.response` is now `ResponseReference`. This raises resource identity relationships above primitive names.

### Route
Controller route targets now carry `ControllerReference` instead of independent controller/action name fields.

### Controller
Resource bindings and resource return semantics now carry `ResourceReference` instead of a bare `ResourceName`.

### Source model graph
`SourceModelReferenceIndex` now carries typed references plus an explicit `SemanticRelationGraph`, replacing independent name-only indexes as the high-level relationship contract.

## Verification
Upstream interface audit reports zero occurrences of:
- JavaScript/TypeScript `null`
- `undefined`
- `any`
- `Record<...>`
- optional properties
- `?.`
- `??`

A narrow TypeScript trace was run. The remaining errors are primarily the expected downstream migration boundary for `RouteParameterType` / `RouteParameterLocation`, plus the pre-existing Node `crypto` typing environment error. These errors were not weakened by changing the upstream ADTs back to strings.

## Rule
Compile errors are treated as migration evidence. The upstream interface remains the source of semantic truth; downstream will be repaired only after the upstream model is sufficiently complete.
