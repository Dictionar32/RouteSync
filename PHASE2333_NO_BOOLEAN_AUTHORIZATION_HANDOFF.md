# Phase 2333 — Remove the Boolean Authorization Handoff

## Goal

Continue from Phase 2332 by evolving existing contracts rather than adding a second authorization interface. The scanner already produces `LaravelRouteAuthorizationSemanticJudgment`; this phase removes the lossy `boolean` handoff from `RouteEmission` and `RouteBoundaryOptions` and makes the existing route-security authority consume that closed judgment.

## Existing contract path after the change

`LaravelRouteScannerInterface.authorizationAuthority.judge(...)`
→ `LaravelRouteAuthorizationSemanticJudgment`
→ `RouteEmission.authorization`
→ `RouteBoundaryOptions.authorization`
→ `RouteSecurityAuthorityInput.authorization`
→ `RouteSecurityJudgment`
→ `RouteCapabilityContract.auth`

The final `RouteCapabilityContract.auth` remains a `TruthValue` because it is a distinct consumer-facing capability projection. It is produced by the upstream security authority, which combines the preserved authorization judgment with the security classification of middleware. The source judgment is no longer flattened into `isAuth: boolean` between the scanner and boundary.

## Changes

- Removed `RouteEmission.auth: boolean`.
- Removed the `isAuth: boolean` argument from existing route emitter functions and both scanner call paths.
- Removed `RouteBoundaryOptions.auth: boolean`.
- Changed `RouteSecurityAuthorityInput` to consume the existing `LaravelRouteAuthorizationSemanticJudgment` ADT instead of a `TruthValue` input.
- Updated the existing deprecated `RouteSecurityResolver` adapter to accept and execute one complete `RouteSecurityAuthorityInput` contract rather than positional middleware/auth values. Updated `RouteSecurityClassifier` to supply an explicit closed absent judgment.
- Bumped the existing route-security authority contract version from `route_security.v1` to `route_security.v2`; no parallel interface/type was introduced.
- Added a regression test for a known Laravel authentication middleware class that is recognized by the authorization authority but not by the separate scheme classifier. The closed authorization judgment must still produce `auth: true`.

## External semantic grounding

Laravel allows middleware at route and controller scopes, including action-specific `only` / `except` and resource-action-specific middleware. Therefore this change deliberately does not claim that declaration middleware alone is the complete effective controller/action policy. That remains a separate trace/integration task against the existing `EffectiveControllerActionPolicy` and `RouteMiddlewareFlow` contracts.

Reference: https://laravel.com/framework/docs/12.x/controllers

## Static verification

`scripts/audits/audit-phase2333-no-boolean-authorization-handoff.cjs` checks the edited contract and wiring surfaces. The static audit passed 13/13 assertions during this phase.

## Not verified / remaining

- Vitest was not run because the archive does not contain `node_modules`.
- TypeScript typecheck/build and CLI integration were not run.
- `semantic/relations` imports remain in the broader scanner/security implementation. This phase does not claim that constraint has been resolved.
- The effective route + group + resource + controller/action middleware policy is not yet fed into the route authorization judgment; only the declaration-level judgment is preserved in this path.
- Some downstream consumers still use the derived `RouteCapabilityContract.auth: TruthValue`; this is a distinct projection, not the source authorization judgment.
