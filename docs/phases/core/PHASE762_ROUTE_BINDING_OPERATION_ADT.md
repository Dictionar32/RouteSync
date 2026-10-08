# Phase 762 — Route Binding Operation ADT

## Build frontier

The DTS frontier reported that `RouteBindingContract` required `operation`, while the boundary builder still constructed a legacy flat binding projection.

The fix is intentionally model-level:

```text
Laravel route evidence
  -> boundary normalization
  -> ResolvedRouteBinding
       -> RouteOperationBinding(controllerName, action, handler)
       -> RouteRequestBinding
  -> RouteBindingContract
       -> operation + request + response + semantic returns
```

`operation` is now the single semantic authority for controller/action/handler identity. The builder no longer reconstructs those values as flat fields.

## Upstream ownership

`ResolvedRouteBoundaryOptions` owns one canonical `ResolvedRouteBinding` judgment. The factory consumes that judgment instead of resolving binding a second time.

This removes the duplicate resolution path:

```text
old: boundary input -> binding resolution
                         + factory -> binding resolution again
new: boundary input -> ResolvedRouteBinding -> factory -> binding contract
```

## Data-flow boundary

The binding operation is an AST/upstream semantic relation, not a free primitive. Downstream consumers read `binding.operation.name`, `binding.operation.controllerName`, and `binding.operation.handler`.

## Legacy removal

The old parsed AST descriptor reservoirs remain empty. No `Parsed*Descriptor` ontology is reintroduced to satisfy the build frontier.
