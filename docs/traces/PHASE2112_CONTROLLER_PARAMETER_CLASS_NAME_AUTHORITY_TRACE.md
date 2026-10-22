# Phase 2112 — Controller Parameter Class-Name Judgment Authority

## Goal

Keep Laravel controller scanner work interface-first. The canonical action resolver previously owned a local class-name classifier. That classifier had a discriminated union, but its decision was still implemented inside the resolver rather than supplied through a semantic authority contract.

## Trace

```text
LaravelControllerScanner
  -> LaravelControllerActionSemanticJudgmentInterface.judge
  -> production composition in laravelControllerExecutionDependencies.ts
  -> scanControllerAction
  -> resolveControllerActionContract
  -> ControllerParameterClassNameJudgmentInterface.judge
  -> ControllerParameterClassNameJudgment
  -> ControllerDependency
  -> ControllerActionContract
  -> LaravelControllerActionExecutionInterface.execute
  -> ControllerProducer / invocation judgment / integrated response
  -> AST / IR / manifest
```

## Changes

- Added `controllerParameterClassNameJudgmentInterface.ts` in the upstream contract layer.
- Declared a closed reasoning vocabulary for model-class, request-origin, table-origin, and non-class expression outcomes.
- The resolved branches preserve the existing nominal `ClassName` type and discriminate model-class versus request-origin outcomes separately.
- Unresolved outcomes retain their reason (`table_origin`, `expression_origin`, or `external_origin`) rather than collapsing into an unqualified unresolved value.
- The resolver now requires the authority through `ControllerActionContractResolverContext`; it no longer contains a duplicate `controllerParameterClassName` classifier.
- The production composition injects the executable authority into the action subscanner seam.
- Updated the resolver's direct unit fixtures to provide the authority dependency.

## Boundaries not claimed as complete

The canonical action resolver still imports body, response, schema, dataflow, AST projection, expression, and resource helpers from legacy subscanner modules. The production judgment composition still calls `scanControllerAction`. Thus this phase does not claim the transitive scanner graph is free of `semantic/relations`, `semantic/foundation`, or all subscanners.

The new judgment only addresses controller-parameter class-name semantics. It does not modify lattice/fixed-point behavior, AST shape, invocation outcome ADTs, or integrated-response ownership.
