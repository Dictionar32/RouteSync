# Interface Trace Audit Phase 82

## Target
Canonical `EndpointContract` / response contract boundary.

## Finding
The endpoint contract still represented semantic route identity with free `string` values and stored `errorUnionType` as a derived string. Error descriptors also used unqualified strings and an unconstrained record schema.

## Repair
- `EndpointContract.id` -> `RouteName`
- `EndpointContract.name` -> `MethodName`
- `EndpointContract.path` -> `RoutePath`
- `EndpointContract.runtimePath` -> `RuntimePath`
- `EndpointContract.groupName` -> `RouteGroupName`
- `EndpointContract.resourceName` -> `ResourceName`
- `EndpointErrorResponseContract.name` -> `ErrorTypeName`
- `EndpointErrorResponseContract.typeName` -> `ErrorTypeName`
- error schema -> `RouteSchemaPayload`
- removed derived `errorUnionType` from canonical `EndpointResponseContract`

## Dataflow invariant

```text
Laravel AST
  -> semantic route/response values
  -> EndpointContract
  -> manifest
  -> lowerer/generator
```

The canonical contract carries semantic facts. Derived generator strings such as `to{Resource}Read` remain naming/emission rules and are not stored as upstream facts.

## Scope
Interface/ADT only. Producer/consumer migration is intentionally deferred to the next flow phase.
