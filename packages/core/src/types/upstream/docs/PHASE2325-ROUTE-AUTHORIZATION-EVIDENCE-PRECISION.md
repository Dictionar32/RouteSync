# Phase 2325 — Route Authorization Evidence Precision

## Existing contract retained

This phase evolves the existing `LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface` and its implementation. It does not introduce a duplicate authority, a generic wrapper, or a V2 contract. `LaravelRouteScannerInterface` remains the upstream wiring owner.

## Defect corrected

The previous authority classified every middleware name beginning with `auth` as authorization middleware. This incorrectly treated unrelated names such as `authorization`, `authenticated`, and `authorizer` as matching evidence.

The catalog now recognizes only the canonical `auth` middleware identity and its parameterized form (`auth:...`). Matching middleware evidence is still preserved by the existing closed judgment ADT.

## Regression coverage

Added tests for canonical `auth`, parameterized guards, unrelated prefix collisions, and mixed middleware evidence.

## Scope and remaining boundary

This change corrects false-positive evidence classification; it does not claim to resolve Laravel custom middleware aliases, middleware groups, controller policies, gates, or all effective authorization semantics. Those require the existing upstream middleware-resolution and controller-policy contracts to be traced and connected end-to-end. No new dependency on `semantic/foundation` or `semantic/relations` was added.

## Verification limitation

The supplied ZIP does not contain installed dependencies, so Vitest and the full TypeScript build were not run in this environment.
