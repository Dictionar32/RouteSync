# Phase 50 — Route Binding Upstream Flow

## Goal

Raise Laravel route semantics upstream so the downstream interface receives a resolved route flow instead of interpreting Laravel syntax.

## Laravel contract checked

Laravel 13 documents:

- route parameters as `{name}` and optional `{name?}` segments;
- dependency injection parameters separately from route parameters;
- implicit model binding when an Eloquent model type-hint matches the route segment name;
- `{post:slug}` as an implicit model-binding custom key;
- scoped / unscoped and `withTrashed` binding options;
- explicit `Route::model` and custom `Route::bind` as separate binding mechanisms;
- route middleware and controller actions as route-level semantics.

Source: official Laravel 13 Routing documentation.

## Implementation

1. `ScannedControllerActionParams` now retains controller parameter AST facts at the upstream scanner boundary.
2. `RouteScanner` receives the already-known model symbol set and controller action map.
3. During upstream route AST construction, `refineImplicitModelBindings()` joins:
   - route path parameter name;
   - controller action parameter name/type;
   - known Laravel model symbols.
4. A plain `{user}` route parameter becomes `implicit_model` only when the target action actually has a matching model type-hint.
5. `{post:slug}` keeps its custom field while the model identity is refined from the action type-hint when available.
6. If no matching model type-hint exists, the route parameter remains its ordinary semantic/convention binding instead of being falsely classified as model binding.

## Boundary rule

`RouteAst` remains construction-only. `RouteDefinition` / `RouteHighLevelContract` carry the semantic route facts. `RouteSyncManifestFlow` remains AST-free.

Route-model binding is intentionally not merged into `ControllerDependencyResolution`: Laravel documents it as routing behavior, while service-container dependency resolution is a separate mechanism.
