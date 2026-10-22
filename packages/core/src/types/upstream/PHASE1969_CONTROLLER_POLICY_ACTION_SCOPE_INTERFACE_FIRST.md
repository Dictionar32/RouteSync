# Phase 1969 — Controller Policy Action Scope, Interface First

## Trace

`controllerAstCanonical.ts` previously interpreted `only` and `except` named arguments in two helpers: `policyActionScope` for attributes and `controllerHasMiddlewareActionScope` for `HasMiddleware::middleware()` expressions. Both helpers independently decided action applicability while building the controller policy relation.

## Change

- Added `ControllerPolicyActionScopeJudgmentInterface` as the typed, closed semantic contract.
- Added `controllerPolicyActionScopeJudgmentAuthority` as the single authority for translating typed `ExpressionArguments` into `ControllerPolicyActionScope` ADT outcomes.
- Updated both existing canonical projection helpers to delegate scope interpretation to that authority.
- Exported the interface and authority through `packages/core/src/index.ts`.
- Added a focused regression test for `only` and default `all` behavior.

## Architectural boundary

This does not create a `relation` or `foundation` subscanner. AST-to-`Expression` mapping remains syntax projection; semantic interpretation of `only` / `except` now goes through the upstream contract. The broader `ControllerPolicyRelation` assembly and `HasMiddleware` capability identification remain partially in the existing controller canonicalization path and are explicit follow-up work, not claimed as solved.

## Verification limits

The Phase 1969 audit validates the interface, authority, exports, and delegation wiring structurally. It does not establish TypeScript compilation or test-run success.
