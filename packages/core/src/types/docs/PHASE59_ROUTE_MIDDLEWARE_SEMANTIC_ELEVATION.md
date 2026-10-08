# Phase 59 — Route Middleware Semantic Elevation

Laravel route middleware may come from route groups, individual routes, and controller class/method declarations. Laravel 13 also supports controller middleware through `HasMiddleware` and controller middleware attributes.

## Boundary

`RouteDeclarationAst` retains source syntax and now distinguishes inherited group middleware from middleware declared directly on the route. `routeMiddlewareResolver.ts` lifts those facts into `RouteMiddlewareContract` ADTs and can merge controller class/method middleware supplied by the upstream controller scanner.

## Principle

AST remains upstream. The downstream flow receives ordered semantic middleware facts and does not parse Laravel fluent calls or PHP attributes.
