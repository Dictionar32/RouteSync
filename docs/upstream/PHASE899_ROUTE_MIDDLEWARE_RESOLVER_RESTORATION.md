# Phase 899 — Restore AST-Free Route Middleware Resolution

## Finding

The active upstream vocabulary retained `RouteMiddlewareFlow` and historical documentation referenced `RouteMiddlewareSemanticInput` and `resolveRouteMiddlewareFlow()`, but the executable resolver boundary was absent from the active source tree.

## Change

- Restore `RouteMiddlewareSemanticInput` as an explicit AST-free contract.
- Restore `resolveRouteMiddlewareFlow()` as an ADT -> ADT resolver.
- Preserve `all | only | except` as a closed scope.
- Treat absent concrete action as non-applicable for scoped middleware while `all` remains applicable.
- Apply `WithoutMiddleware` semantics through explicit exclusion contracts.
- Match exclusions by middleware identity, not by host string formatting or execution order.
- Preserve declaration and exclusion provenance.
- Do not claim middleware execution order.

## Boundary

```text
Laravel AST
  -> semantic adapters
  -> RouteMiddlewareSemanticInput
  -> resolveRouteMiddlewareFlow()
  -> RouteMiddlewareFlow
  -> RouteSemanticFlow / graph projection
```

Controller policy relations remain an evidence producer. Controller `HasMiddleware` remains a separate evidence frontier for the next phase; it is not fabricated by this resolver.
