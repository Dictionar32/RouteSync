# Phase 2108 — Controller Scanner Descriptor Retirement Trace

## Goal

Keep the controller scanner as the priority and stop constructing the compatibility descriptor on the active action execution path. The scanner already consumes `ControllerActionContract`; building `ScannedControllerActionDescriptor` in parallel was redundant work and preserved an unnecessary compatibility projection in the path.

## Trace

```text
LaravelControllerScannerExecutor
  -> LaravelControllerActionExecutionInterface.execute(input)
  -> wiring adapter
  -> scanControllerAction(...)
  -> resolveControllerActionContract(...)
  -> ControllerActionContract
  -> descriptor-free execution result
  -> response / dataflow resource binding / action identity projection
  -> ControllerProducer + invocation judgment
  -> integrated response judgment + AST projection judgment
  -> LaravelControllerScanJudgment
```

## Actual change

- `actionScanner.ts` no longer imports `ScannedControllerActionDescriptor` or `ControllerActionInfo`.
- `scanControllerAction` now returns the canonical contract and dependencies only.
- `LaravelControllerActionExecutionResult` no longer carries `compatibilityDescriptor`.
- Wiring forwards the contract without building or forwarding a second action descriptor.
- Scanner response, resource bindings, and action identity continue to project from the canonical contract.

## Remaining architecture defects

This is a focused removal of redundant descriptor construction, not full legacy-subscanner retirement. The adapter still calls `scanControllerAction`; `resolveControllerActionContract` still imports `semantic/relations` and subscanner helpers. In addition, the upstream execution interface currently imports `ControllerActionContract` from a compiler descriptor module. The next interface-first step should move/evolve the semantic contract and its dependent domain types to an upstream-owned boundary before replacing the legacy resolver; simply wrapping the resolver in another function would not fix ownership.

## Validation boundary

The audit is source-structural only. No build, TypeScript typecheck, or Vitest run is claimed.
