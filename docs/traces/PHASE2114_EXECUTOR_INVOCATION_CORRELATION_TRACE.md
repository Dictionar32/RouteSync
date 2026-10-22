# Phase 2114 — Executor invocation correlation trace

## Scope

This phase is a narrow type-contract improvement after Phase 2113. It does not claim to retire the legacy controller action resolver or to eliminate relation/foundation/subscanner usage across the repository.

## Trace

1. `laravelControllerInvocationSemanticJudgmentInterface.ts` defines a closed union of invocation outcomes, including complete, blocked, not-connected, and source-binding-rejected outcomes.
2. `laravelControllerActionExecutionInterface.ts` previously typed `invocationJudgment` as that entire union in both input and result, even when a caller possessed a narrower outcome.
3. The executor interface now carries `TInvocationJudgment` as a generic constrained by the closed union. The exact invocation variant is preserved from input to result; the default keeps existing one-parameter executor references compatible.
4. The executor contract still only forwards the already-closed judgment and does not classify semantic outcomes.

## Deliberately not claimed

- `ControllerActionContract` remains the production projection used by the controller action judgment.
- `scanControllerAction` still reaches `resolveControllerActionContract` through the legacy composition seam.
- Integrated response judgment remains produced later by the response semantic pipeline; this patch does not pretend it has been moved into action execution.
- No global relation/foundation/subscanner retirement, lattice rewrite, or fixed-point algorithm change is included.
- Build, typecheck, and Vitest were not run in this environment.
