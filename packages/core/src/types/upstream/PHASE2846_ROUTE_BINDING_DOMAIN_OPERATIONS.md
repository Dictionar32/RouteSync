# Phase 2846 — Route Binding Domain Operations

## Runtime trace

`semanticDataflowRequestProjection` / `semanticDataflowRouteProjection` → `routeBindingInterfaceFactory.fromParameters` → `RouteBindingInterface` → domain operations `containsParameter` / `isBound`.

## Contract decision

The existing `RouteBindingInterface` was the canonical contract, so this phase evolves it instead of introducing a parallel binding model. The former exported `routeBindingInterfaceFrom` constructor is replaced by the interface-first `routeBindingInterfaceFactory` operation. The resulting ADT exposes queries backed by the same canonical parameter set and computed bound subset.

## Usage

```ts
const binding = routeBindingInterfaceFactory.fromParameters(route.bindings.parameters);
const isPresent = binding.operations.containsParameter(parameterName);
const isResolved = binding.operations.isBound(parameterName);
```

The `collections.ts` upstream file remains empty. Structural audit only; this document does not claim full-project typecheck or E2E success.
