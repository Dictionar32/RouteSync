# Phase 2334 — Canonical Authorization Owns Security Classification

## Root cause

`RouteSecurityAuthorityInput` already carried `LaravelRouteAuthorizationSemanticJudgment`, but `classifySecurity()` independently classified raw middleware names such as `auth`, `auth:api`, and `auth:sanctum`. This created two semantic owners. In particular, recognized Laravel middleware classes such as `Illuminate\\Auth\\Middleware\\Authenticate` could produce `auth: true` while the security descriptor remained public because the independent classifier did not recognize the class name.

## Change

- Evolved the existing `routeSecurityAuthority` implementation; no duplicate authority or V2 interface was added.
- Raw route middleware continues to contribute ability/role metadata.
- Authentication scheme and protected-state classification now consume only the middleware evidence carried by the canonical `LaravelRouteAuthorizationSemanticJudgment`.
- The closed `present | absent` judgment therefore governs both the route `auth` value and the security descriptor's protected state.
- Existing known scheme projection remains: `auth:sanctum` → Sanctum; `auth:api` / `auth:bearer` → Bearer; other recognized authentication evidence → Cookie.

## Regression coverage

The existing Phase 2333 test now asserts that the recognized framework class `Illuminate\\Auth\\Middleware\\Authenticate` produces a protected security descriptor. A new regression test supplies raw `auth:api` middleware with an explicit `absent` judgment and asserts that the security descriptor remains public and `auth` remains false. This verifies that downstream code does not independently reinterpret middleware contrary to the upstream judgment.

## Scope limits

- This does not resolve controller/action effective middleware policy. `EffectiveControllerActionPolicy` and `RouteMiddlewareFlow` still require end-to-end connection to route scanning.
- This does not remove existing `semantic/relations` imports from the scanner tree.
- It does not claim CLI integration or full project typecheck/build success.
