# Phase 1302 — Upstream Capability Contract / Wiring Closure

## Authority invariant

RouteSync semantic meaning is resolved once at the upstream boundary:

```text
Laravel/source evidence
  -> semantic reasoning
  -> capability algebra
  -> capability contract
  -> consumer interface
  -> upstream wiring
  -> manifest / graph / IR / SDK / React projection
```

Downstream layers are not allowed to reconstruct semantic meaning from route
paths, HTTP methods, action names, operation-id strings, or raw domain-intent
objects.

## Capability closures

- `OperationIdentityCapability` owns operation identity.
- `DomainIntentCapability` owns domain-intent kind, operation references and
  aggregate-collection field configuration.
- `RouteParameterCapability` owns route-parameter identity and target scope.
- `DataFlowProducerInterface` owns execution/closure production.
- `DataFlowConsumerInterface` is the read-only downstream authority surface.

## React boundary

React consumes:

- `DomainIntentCapabilityReference` for aggregate intent execution.
- `RouteDefinition.targetScope` for collection/member dispatch.
- `RouteDefinition.routeParameter` for parameter identity.
- `RouteDefinition.crudRole` / `hookKind` for already-closed route semantics.

React must not:

- split `operationId` to recover resource/action;
- inspect `domains.<group>` to reconstruct intent;
- infer CRUD slots from endpoint property names;
- inspect route paths for `:` parameters;
- call `PathResolver.extractParams` for semantic parameter discovery.

## Wiring rule

Projection code may serialize or transport a closed capability. It may not add
new semantic cases or fallback classifications.

## Audit rule

`semantic-ownership-coverage.cjs` therefore checks both presence of the
upstream contract and absence of the known downstream reconstruction paths.

## Related architecture

The design follows the interface boundary principle used by MLIR: generic
consumers operate through semantic interfaces rather than encoding concrete
operation knowledge. Data-flow ownership follows the same source/flow/consumer
separation used by data-flow analysis systems such as CodeQL.
