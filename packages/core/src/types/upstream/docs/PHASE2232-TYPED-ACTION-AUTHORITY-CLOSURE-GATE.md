# Phase 2232 — Typed action-authority closure gate

## Root cause

The action authority already published `action_semantic_knowledge_partial`, but the public coverage type had no distinct `action_semantic_knowledge_complete` branch. As a result, completion was described only in prose and there was no structural representation of the condition required before claiming the action semantic surface had been fully migrated.

## Interface-first change

- Evolved the existing `LaravelControllerActionSemanticKnowledgeCoverage` instead of adding another authority.
- Added `LaravelControllerActionSemanticKnowledgeCompleteCoverage` with empty-tuple remainders for projection, derivation ownership, and publication obligations.
- Kept `controllerActionSemanticKnowledgeCoverage` on the existing partial branch. Production does not claim closure while `scanControllerAction` / `resolveControllerActionContract` and the legacy action adapter still own work.
- Bumped the existing action semantic contract version from 28 to 29 and synchronized the composition metadata and regression guards.
- Exported the complete and partial coverage members through the package's public type surface.

## Trace and ownership

`sourceAstScanner` → `LaravelSourceAstPipelineInterface.execute()` → `LaravelControllerScannerInterface.scan()` → `LaravelControllerActionSemanticJudgmentAuthorityInterface.judge()` → `LaravelControllerActionExecutionInterface.execute()` → `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse()` → AST projection.

The exact invocation judgment remains attached to the action judgment and is passed to integrated response. The response pipeline continues to own canonical integrated response products; action semantics do not reconstruct a parallel response descriptor.

## Explicitly open migration debt

This phase does **not** retire the controller action subscanner. `laravelControllerExecutionDependencies.ts` still binds `actionJudgment.judge` to `scanControllerAction`, which calls `resolveControllerActionContract`. Body evidence derivation and resource-binding domain publication remain open ownership obligations. Moving that code to a different file or renaming it would not close the obligations. The next implementation must connect the existing body, dataflow, schema, request, dependency, and resource-binding authorities directly through an upstream-owned action semantic composition contract before retiring the legacy path.

## Validation boundary

The phase audit checks contract shape, coverage honesty, invocation/response correlation, and the known open subscanner edge. It is a structural audit only; it does not establish TypeScript compilation or test-suite success.
