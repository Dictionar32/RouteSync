# Phase 2110 — Controller Action Native Judgment Trace

## Goal

Continue from the existing Laravel controller action judgment/executor split. This phase removes the canonical action contract resolver's direct dependency on `semantic/relations` and represents two internal semantic decisions as discriminated unions. It does **not** claim that the complete scanner graph is free of legacy subscanners.

## Source trace

```text
LaravelControllerScanner
  -> LaravelControllerActionSemanticJudgmentInterface.judge(input)
  -> legacy composition adapter
  -> scanControllerAction
  -> resolveControllerActionContract
       -> native typed source tuples for request index
       -> ControllerParameterClassNameJudgment ADT
       -> ControllerContextualAttributeJudgment ADT
       -> ControllerActionContract
  -> LaravelControllerActionExecutionInterface.execute(...)
  -> ControllerProducer + integrated invocation response
  -> AST / IR / manifest
```

## Changes

- `ControllerActionContractResolverContext.formRequestIndex` now states its existing data shape directly as immutable `[name, FormRequestSource]` tuples instead of importing `RelationIndex`.
- `customContextualAttributeNames` is declared as an immutable string collection rather than the relation membership alias.
- `resolveControllerActionContract` no longer imports or invokes `semantic/relations` functions.
- Parameter class-name interpretation returns a closed `ControllerParameterClassNameJudgment` ADT.
- Contextual attribute interpretation returns a closed `ControllerContextualAttributeJudgment` ADT.
- PHP attribute argument variants are handled through their discriminants: `positional`, `unpacked`, and `named`.
- The canonical action contract remains the single result consumed by the execution interface; no descriptor is reintroduced.

## Remaining blockers — explicitly not complete

The resolver still imports legacy scanner helpers for body resolution, response-attribute resolution, schema extraction, dataflow construction, AST canonicalization, and PHP-expression projection. Some of those helpers themselves import `semantic/relations` or other subscanner helpers. The wiring adapter still calls `scanControllerAction`.

Therefore this phase proves only that the **canonical action contract resolver itself** no longer depends directly on `semantic/relations`; it does not prove transitive removal of `relation`, `foundation`, or `subscanners` from the production scanner graph.

## Verification boundary

The audit is structural and source-based. No package build, TypeScript typecheck, or Vitest run is claimed for this phase.


## Phase 2111 correction: preserve the existing semantic name type

The resolved branch of `ControllerParameterClassNameJudgment` now carries the existing upstream `ClassName` type instead of `string`. Model/request semantic names are converted to `ClassName` at the boundary where their role is interpreted, and dependency construction forwards that typed value without unwrapping and re-wrapping it. This prevents a raw string from becoming the intermediate authority after the repository already provides a nominal semantic type.
