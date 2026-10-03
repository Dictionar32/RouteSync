# Phase 63 — Effective Route Middleware Flow

Laravel applies controller middleware according to `only` / `except`, while route/group middleware is attached to the route. Laravel also supports middleware exclusions. The upstream semantic boundary now resolves those applicability rules before the downstream flow sees the route.

## Change

`RouteMiddlewareFlow.effectiveMiddleware` contains the middleware applicable to the concrete route action. It is deliberately not an execution-order claim.

The resolver remains AST-free. `RouteMiddlewareAstAdapter` remains the AST → ADT boundary.

## Pipeline

```text
Laravel source
  -> AST
  -> AST -> semantic adapter
  -> RouteMiddlewareSemanticInput
  -> RouteMiddlewareFlow
       - declarations
       - exclusions
       - effectiveMiddleware
  -> RouteSemanticFlow
  -> downstream interface/flow
```

The concrete action is used only to evaluate `only` / `except`. If no action is supplied, scoped controller middleware is not treated as applicable; `all` middleware remains applicable.
