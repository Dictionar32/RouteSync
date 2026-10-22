# Phase 2203 — Response Scanner Upstream Dependency Closure

## Root cause

Phase 2202 preserved `LaravelControllerMethodResponseAstProjectionJudgment` values through `ResponseScannerBundle` and the canonical `SourceAsts` aggregate. However, `laravelSourceAstPipeline.ts` still invoked the concrete `scanResponseBundle(...)` function directly. The response acquisition boundary therefore had no upstream scanner contract and could not be replaced through the source-AST pipeline's declared dependencies.

## Interface-first change

- Added `LaravelResponseScannerInterface`, `LaravelResponseScannerInput`, and `LaravelResponseScannerResult` to the existing upstream type owner.
- The scanner input explicitly carries the canonical `LaravelControllerScanJudgment`, resolved resource definitions, source-project identity, and selected response semantic pipeline.
- The result retains response definitions, ASTs, and the exact method response projection judgments.
- Added `LaravelSourceAstPipelineDependenciesInterface` to the existing upstream source-AST pipeline contract.
- Added `createLaravelSourceAstPipeline(dependencies)`; the source-AST executor now delegates response acquisition through the injected interface.
- The composition root selects `laravelResponseScanner` as the default implementation. The existing function remains as a compatibility entry point.
- Bumped `LaravelSourceAstPipelineInterface.contractVersion` from 4 to 5 because its dependency contract now explicitly includes response acquisition.

## Architecture constraints

No new semantic authority was introduced. The adapter delegates to the existing response pipeline and keeps its exact projection judgments. No invocation judgment is reconstructed, and no runtime output-type reclassification was added. No new `relation`, `foundation`, or replacement `subscanner` layer was added.

## Remaining gaps

- The concrete adapter still lives under `compiler/scanner/subscanners/responseScanner.ts`; this phase establishes the upstream contract and injection point but does not retire that legacy directory.
- The existing response scanner implementation still has direct imports from `semantic/relations`; this phase does not claim that the transitive or full repository dependency graph is relation-free.
- Other source-AST acquisition domains are still invoked through concrete implementations by the pipeline and need their own trace before the pipeline can be called a complete interface-only executor.
- Full TypeScript typecheck, Vitest, and package build were not run.
