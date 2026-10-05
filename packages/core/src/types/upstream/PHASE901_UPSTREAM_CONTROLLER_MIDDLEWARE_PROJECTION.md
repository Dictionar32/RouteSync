# Phase 901 — Upstream Controller Middleware Projection

Phase 901 closes the producer wiring gap left by the Phase 900 HasMiddleware evidence work.

## Changes

- `ControllerProducer` now forwards `controllerInterfaces` and `controllerMethods` into `controllerMethodContractFromMethod()`.
- The executable controller producer path therefore preserves `HasMiddleware::middleware()` evidence instead of only direct unit construction seeing it.
- Added `projectControllerMiddlewareRelations()` as an AST-free semantic projection from `ControllerPolicyRelation` to the existing `RouteMiddlewareContract` / `RouteMiddlewareExclusionContract` vocabulary.
- Named middleware is projected with class/method provenance and `all` / `only` / `except` action scope.
- `ControllerMiddlewareRelation` values backed by `Expression` are deliberately not coerced into `MiddlewareName`; they remain controller policy evidence so class/closure/unresolved middleware cannot be misidentified.

## Authority boundary

`ControllerMiddlewareRelation` remains the lossless controller evidence authority. The route middleware ADT is a named-middleware projection used only when the target can be represented without semantic loss.

Route middleware resolution remains the effective-policy authority after route-group, route, resource, and controller evidence are aggregated. This phase does not claim runtime middleware execution order.
