# Phase 903 — Upstream Route Middleware Semantic Input Aggregation

## Purpose

Close the middleware projection boundary by providing one AST-free input builder for the existing `resolveRouteMiddlewareFlow()` authority.

## Canonical flow

```text
route-group middleware
        +
route middleware
        +
resource middleware / middlewareFor / withoutMiddlewareFor
        +
controller #[Middleware] / #[WithoutMiddleware]
        +
HasMiddleware evidence
        ↓
buildRouteMiddlewareSemanticInput()
        ↓
RouteMiddlewareSemanticInput
        ↓
resolveRouteMiddlewareFlow()
```

## Invariants

- The builder consumes canonical semantic evidence only; it does not inspect AST nodes.
- Group and direct-route middleware are projected as `scope: all`.
- Resource/controller scoped declarations and exclusions retain their existing scope.
- Evidence ordering is stable: route group, route, resource, controller.
- The builder does not decide applicability or exclusion; `resolveRouteMiddlewareFlow()` remains the authority.
- Middleware references preserve Laravel `name:parameters` syntax through `RouteMiddlewareReference`.
- `withoutMiddlewareFor()` is represented as an exclusion scoped to `only` the specified resource actions, matching Laravel semantics.
- The builder does not claim runtime execution order.

## Deliberate boundary

Expression/class/closure controller middleware remains controller evidence when it cannot be represented by the named `RouteMiddlewareContract`. No lossy string coercion is introduced here.
