# Interface Trace Audit - Phase 78

## Target
Response contract interfaces that exposed generator-derived artifact names as canonical upstream data.

## Trace
Laravel response declaration / response DTO
→ Laravel-bound AST
→ semantic response descriptor
→ RouteManifest
→ frontend/API lowering

The response descriptor is the semantic boundary. Mapper names, validator names, and transformed read type names are emission artifacts derived later from semantic response identity and shape. They are not independent upstream facts.

## Repair
- Removed `ResponseArtifactIdentity` from the response descriptor interface hierarchy.
- Removed `identity` from resource, model, inline, and void response descriptors.
- Removed `readTypeName`, `mapperName`, `validatorName`, and duplicate `shape` fields from `EndpointSuccessResponseContract`.
- Kept `descriptor: ResponseDescriptor` as the single response semantic carrier.

## Invariant
`EndpointSuccessResponseContract` contains no generator-specific mapper/validator/type-name contract fields.

## Scope
Interface/model boundary only. Existing producers and consumers are intentionally not migrated in this phase. Their compile failures are expected evidence of downstream coupling to the old contract.

## Reference
The ecommerce-shop generated `frontend/api` mapper output is evidence of what the emitter produces, not evidence that mapper function names belong in the upstream manifest contract.
