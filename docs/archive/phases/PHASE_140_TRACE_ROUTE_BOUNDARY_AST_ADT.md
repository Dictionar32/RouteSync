# Phase 140 — Trace Route Boundary AST ADT

## Boundary repaired

`ControllerActionContract.runtimeReturn` now survives:

`ControllerActionContract → ScannedControllerActionDescriptor → ControllerActionInfo → RouteBoundaryOptions → RouteBindingContract → ScannedRouteDescriptor.runtimeReturn`

## Architectural repair

A scanner-owned controller expression contract must not leak into `types/domain`. The route boundary now consumes the canonical domain `ControllerRuntimeReturn` vocabulary from `types/domain/controllerExpression.ts`. This makes the route contract independent of scanner implementation details.

## No re-classification rule

Controller-action routes carry the already-resolved runtime expressions. Controller references, closures, and synthetic routes explicitly carry `{ kind: 'none' }`. No route factory needs to inspect source expressions to decide whether a runtime return exists.

## Remaining trace target

`ScannedRouteDescriptor.runtimeReturn → ParsedRoute / EndpointContract → RouteManifest`

The next repair is only needed if that field is dropped again at the final route/manifest projection.
