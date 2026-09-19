# Error Repair Checkpoint 02 — Authentication Registry

## Status
Completed.

## Root cause
`AuthorizationHeaderName` had already been changed to a closed ADT, but `SECURITY_SCHEME_REGISTRY` still supplied raw strings and `null` values.

## Repair
- Authorization header is represented by `{ kind: 'authorization', value: 'Authorization' }`.
- Schemes without an authorization header use `{ kind: 'none' }`.
- No nullable header value is used in the registry.

## Verification
The registry now matches `SecuritySchemeSpecification.defaultHeaderName: AuthorizationHeaderName` structurally.

## Next root cause
`ContractInputBoundary` still constructs the old object-literal shape for the class-based `ResolvedSemanticType` hierarchy. This must be repaired before `ResourceFieldFlattener`.
