# Phase 2329 — Existing route-security authority classification closure

## Scope

Continue from Phase 2328 by auditing the existing upstream authorization and route-security authorities. No new authority interface or parallel ADT is introduced.

## Finding

`LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface` already rejected `auth:` and `auth:   `, but `routeSecurityAuthority` independently classified any normalized middleware name beginning with `auth:` as cookie authentication. The same malformed evidence could therefore be absent from the scanner's authorization judgment but still mark the route security descriptor as protected later in boundary resolution.

## Change

The existing `middlewareSecurityState` now classifies `auth:<guard>` as cookie authentication only when the normalized guard suffix is non-empty. Exact `auth` remains valid, and `auth:sanctum`, `auth:api`, and `auth:bearer` retain their existing specialized schemes.

Regression tests cover `auth:`, whitespace-only `auth:   `, and valid `auth:api` using the existing `routeSecurityAuthority` contract.

## Existing contract trace

`LaravelRouteScannerInterface.authorizationAuthority` → `LaravelRouteAuthorizationSemanticJudgment` → route emission (currently reduced to `boolean isAuth`) → route boundary input → `RouteSecurityAuthorityInput` → `RouteSecurityAuthorityAlgebraInterface.resolve` → `RouteSecurityJudgment` → `RouteCapabilityContract`.

The trace identifies two distinct issues:

1. The malformed-guard inconsistency between the existing authorization authority and the existing route-security authority is fixed in this phase.
2. The scanner still reduces the full authorization judgment to `boolean isAuth`. Preserving that judgment through `RouteEmission`, route boundary projection, and manifest consumers remains an architectural follow-up requiring a complete consumer migration; this phase does not claim it is solved.

## External semantic reference

Laravel documents middleware on routes and controller actions, including `only`/`except` scopes and resource-specific middleware. Effective authorization must not be inferred from route-declaration middleware alone: https://laravel.com/framework/docs/12.x/controllers

## Verification

The source-level regression test is added but has not been executed in this environment. TypeScript build and end-to-end CLI integration remain unverified.
