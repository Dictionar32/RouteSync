# Phase 2046 — Effective Policy Canonical Scope Delegation

## Trace finding

The controller-policy scope judgment is already owned by `effectiveControllerActionPolicyAlgebra.authorization`, but the historical scanner-side effective-policy resolver independently implemented `actionApplies` and `authorizationApplies`. This was duplicate semantic ownership, not a missing subscanner.

## Change

The existing scanner-side resolver still owns its middleware-flow orchestration and inherited-policy inventory. Authorization filtering now delegates to the existing upstream algebra, which handles `blocked`, `all`, `only`, `except`, and `only_except`. The local duplicate action-scope predicate was removed. Blocked scope reasons still contribute to the enclosing `EffectiveControllerActionPolicyJudgment`.

No new authority, relation/foundation subscanner, invocation judgment, or response judgment was added. Invocation and integrated response wiring are unchanged.

## Verification boundary

The Phase 2046 audit is structural. The focused Vitest regression cases were added for `only_except` and blocked authorization, but they were not executed in this environment. Full TypeScript type-check and `npm run build` were not run.
