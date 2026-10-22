# Phase 2045 — Policy Action Scope Judgment, Interface First

## Trace finding

`controllerPolicyRelationsFromAttributes` received class-level and method-level attributes in one sequence, then applied the current action to every `Authorize` attribute. That bypassed the existing upstream `ControllerPolicyActionScopeJudgmentInterface` and made class-level authorization appear action-specific even though `ControllerAuthorizationRelation` documents class scope as applying to all actions.

## Change

- Evolved the existing `ControllerPolicyActionScopeJudgmentInterface` with `analyzeAttribute(scope, action, arguments)` rather than introducing a second policy authority.
- The existing authority now closes attribute applicability: class scope resolves to `all`; method scope with a known action resolves to `only(action)`; method scope without a known action delegates to the existing only/except judgment.
- `controllerPolicyRelationsFromAttributes` delegates authorization action applicability to that upstream interface.
- Existing `analyze(arguments)` remains intact for middleware only/except analysis and `HasMiddleware` projection.
- Invocation semantic judgment and integrated response wiring remain unchanged. No relation/foundation subscanner was added.

## Verification

Run `node scripts/audits/audit-phase2045-policy-action-scope-judgment-interface-first.cjs`.

This audit verifies source contracts and wiring. It does not substitute for full TypeScript type-checking or a monorepo build.
