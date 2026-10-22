# Phase 2107 — Controller Scanner Canonical Action Contract Trace

## Scope

This phase deliberately returns focus to the Laravel controller scanner. It does not change fixed-point analysis or claim to retire all legacy subscanners.

## Trace

```text
LaravelSourceAstPipeline
  -> LaravelControllerScannerInterface.scan(input)
  -> authority-closed invocation inventory
  -> source-bound declaration correspondence
  -> declaration-inventory closure gate
  -> LaravelControllerActionExecutionInterface.execute(input)
  -> wiring adapter: scanControllerAction (legacy implementation seam)
  -> ControllerActionContract (descriptor-free execution result)
  -> controller response projection from contract.response
  -> resource-binding projection from contract.dataflow.resourceBindings
  -> action identity from contract.identity.actionName
  -> ControllerProducer + source-correlated invocation judgment
  -> integrated response judgment + AST projection judgment
  -> closed LaravelControllerScanJudgment
```

## Changes

- Promoted `LaravelControllerActionExecutionInput`, `LaravelControllerActionExecutionResult`, and `LaravelControllerActionExecutionInterface` to `types/upstream/laravelControllerActionExecutionInterface.ts`.
- Kept runtime composition in `compiler/scanner/wiring/laravelControllerExecutionDependencies.ts`; the upstream module declares contracts only.
- Phase 2108 removes compatibility descriptor construction from the active action-execution path; the canonical contract is the only action semantic result returned by the adapter.
- The controller scanner now projects response, resource bindings, and action identity from `ControllerActionContract`; it no longer consumes the compatibility descriptor.
- Exported the interface through the upstream barrel and package public entry.

## Remaining boundary

The wiring adapter still invokes `scanControllerAction` from `subscanners/controller`. That implementation reaches `resolveControllerActionContract`, which imports `semantic/relations` and subscanner helpers. Phase 2108 removes descriptor creation from this path but does not claim the entire controller scanner dependency graph is free of relations, foundation, or subscanners. The upstream execution interface also still imports `ControllerActionContract` from a compiler descriptor module; that dependency direction remains a separate interface-first migration target.

## Validation

The Phase 2107 audit is a source-level structural audit. Build, TypeScript typecheck, and Vitest are not represented as having run.
