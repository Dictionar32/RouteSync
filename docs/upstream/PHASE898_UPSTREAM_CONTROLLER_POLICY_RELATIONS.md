# Phase 898 — Upstream Controller Policy Relations

Phase 898 elevates Laravel controller policy attributes from generic attribute evidence into closed upstream relations without replacing the generic attribute evidence.

## Relations

- `ControllerMiddlewareRelation` preserves middleware target, class/method scope, `only`/`except` action applicability, exclusion state, and source provenance.
- `ControllerAuthorizationRelation` preserves the full `Authorize` argument list and class/method scope.

`Middleware`, `WithoutMiddleware`, and `Authorize` are recognized only as semantic projections of existing attribute evidence. Route middleware and route model binding remain route upstream authorities.

The projection does not infer authentication or authorization from method names and does not flatten `only` / `except` into booleans.
