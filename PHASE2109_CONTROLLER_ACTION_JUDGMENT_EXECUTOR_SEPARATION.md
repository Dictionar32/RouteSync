# RouteSync Phase 2109 — Controller Action Judgment / Executor Separation

The controller scanner now separates semantic judgment from runtime execution.

`LaravelControllerActionSemanticJudgmentInterface.judge(...)` receives source-bound method evidence and returns a completed judgment containing the canonical action contract. `LaravelControllerActionExecutionInterface.execute(...)` receives that completed judgment together with the exact invocation judgment and only forwards the correlated result.

This is a real boundary improvement: the runtime executor no longer accepts raw AST/context inputs and no longer invokes the legacy action scanner. It is not yet a full retirement of `semantic/relations` or subscanners: the current judgment authority still delegates to `scanControllerAction` and `resolveControllerActionContract`. The upstream judgment interface also still imports the compiler-owned `ControllerActionContract`; that dependency direction is explicitly recorded as unfinished.

See `docs/traces/PHASE2109_CONTROLLER_ACTION_JUDGMENT_EXECUTOR_SEPARATION_TRACE.md` for the full trace and remaining migration debt.
