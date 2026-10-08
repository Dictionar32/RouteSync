# Phase 1089 — Graph Surface Wiring Regression Closure

## Trace

The Phase 1088 graph surface minimization exposed one stale field access in
`manifestGraphCompiler.ts`: `GraphServiceSurface` owns `name`, while the compiler
still read `service.identity.name`. The compiler is now aligned with the
actual downstream surface and uses `service.name`.

## Boundary

The architecture remains:

`RouteSyncManifest -> RouteSyncManifestFlow -> RouteSyncManifestGraphSurface -> ServiceGraph`

with `InterfaceDependencyBoundary<Upstream, Downstream>` at each downstream
projection/wiring boundary. `DataFlowInterface` remains generic and unchanged.

## Evidence trace

The ecommerce fixture shows:

- controller/request expressions such as `$request->user()->id` and
  `Order::where('user_id', ...)` as value-flow evidence;
- `OrderResource` as response/resource projection evidence;
- `with(...)` / `load(...)` as explicit loaded-relation evidence;
- migration foreign keys such as `orders.user_id` and `order_details.order_id`
  as structural schema evidence.

Laravel 13 documents that loaded Eloquent relationships are recursively included
when models are serialized, which supports keeping resource/relationship
projection distinct from generic dataflow closure.

## Validation

Phase 1089 regression audit plus Phase 1085–1088 audits pass.
Full TypeScript build remains unavailable because the workspace has no local
`node_modules/.bin/tsc` / TypeScript runtime.
