# Phase 904 — Upstream Middleware Identity

Phase 904 makes route middleware identity an explicit semantic boundary.

## Change

`RouteMiddlewareReference` keeps the middleware name plus invocation parameters, while `RouteMiddlewareIdentity` contains only the named middleware identity.

`resolveRouteMiddlewareFlow()` now compares exclusions through `routeMiddlewareIdentity()` rather than comparing host strings directly.

This means `auth:web` and an exclusion of `auth` match by middleware identity while parameters remain preserved as invocation evidence.

## Boundary

- Parameters remain lossless declaration data.
- Identity is used only for exclusion matching.
- Controller class/closure/unresolved expressions are still not coerced into named route middleware.
- Runtime middleware execution order is still outside this resolver's authority.

## Rationale

Laravel documents middleware exclusions by middleware identity while middleware strings may carry parameters. The resolver therefore must not accidentally make parameters part of identity.
