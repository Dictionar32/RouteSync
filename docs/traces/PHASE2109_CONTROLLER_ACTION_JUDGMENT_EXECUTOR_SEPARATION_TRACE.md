# Phase 2109 — Controller Action Judgment / Executor Separation

## Objective

Move the controller scanner one step closer to interface-first execution: semantic interpretation of a method must happen before the runtime executor is called. The executor must not invoke `scanControllerAction`, resolve request/response/dataflow semantics, or rebuild the contract.

## Trace

```text
LaravelControllerScannerExecutor
  -> LaravelControllerActionSemanticJudgmentInterface.judge(invocation judgment + method evidence)
      -> current wiring implementation
          -> scanControllerAction
              -> resolveControllerActionContract
                  -> legacy semantic/relations + subscanner helpers
      -> LaravelControllerActionSemanticJudgment
          kind: controller_action_semantic_judgment_completed
          exact invocation judgment + its source identity + generic action projection + dependencies
  -> LaravelControllerActionExecutionInterface.execute(completed correlated semantic judgment)
      -> forward correlated result only
  -> response / resource binding / action identity projections
  -> ControllerProducer + integrated invocation response
  -> AST / IR / manifest
```

## Actual change

- Added `LaravelControllerActionSemanticJudgmentInterface` and its source-bound input / completed judgment contracts under `types/upstream`.
- Changed the scanner to request the semantic judgment first, then pass that completed judgment to the runtime executor.
- Phase 2117 tightened the correlation: action judgment input owns the exact invocation judgment and derives its source identity from it; execution accepts only that completed action judgment, not a second parallel invocation value.
- The wiring executor now only forwards the invocation judgment and semantic judgment fields. It no longer calls `scanControllerAction`.
- The current judgment authority still delegates to `scanControllerAction`; that is intentionally documented as the next migration seam, not claimed retired.

## Invariants

1. The runtime executor cannot accept a raw `ControllerMethodAst` and therefore cannot independently classify a method.
2. `ControllerActionContract` is preserved as the canonical action semantic product for current projections.
3. Invocation source identity and the exact invocation ADT remain attached to the action judgment and execution result.
4. No compatibility descriptor is recreated.
5. No new relation/foundation abstraction or replacement subscanner is introduced.

## Known remaining dependency debt

- `actionJudgment` wiring still calls `scanControllerAction`.
- `scanControllerAction` still calls `resolveControllerActionContract`.
- `resolveControllerActionContract` still imports `semantic/relations` and controller/resource subscanner helpers.
- `LaravelControllerActionSemanticJudgmentInterface` currently imports `ControllerActionContract` from the compiler directory. The contract's AST/body/dataflow fields must be promoted or decomposed into upstream-owned semantic types before this direction can be removed without lying about dependencies.
- The new semantic judgment currently has only a completed variant because the legacy resolver does not expose a typed blocked/incomplete result. Do not fabricate a blocked branch until failure evidence is modeled upstream.

## Verification scope

Static source audits only. Build, typecheck, and Vitest are not run in the unsupported assistant environment.
