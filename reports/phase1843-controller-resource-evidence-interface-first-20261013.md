# Phase 1843 — Controller Resource Evidence, Interface First

## Trace finding

`LaravelResourceScannerInterface` and `ResourceModelBindingJudgmentInput` already receive the complete `LaravelControllerScanJudgment`, including each controller's source-correlated integrated invocation response. However, the new `laravelControllerScanner` artifact did not retain controller resource-return facts. The legacy pipeline therefore still called `ControllerScanner.scanCanonicalBundle()` solely to recover a controller index and extract resource bindings for `ResourceScanner`.

## Interface change

- Added `ControllerResourceBindingEvidence` to `laravelControllerScannerInterface.ts`. It preserves controller/action identity, resource reference, source-derived model origin, response reference, and source span.
- Added `resourceBindings` to each `LaravelControllerScanArtifact`, keeping those source facts in the same controller artifact as the exact `invocationJudgment`.
- Updated `laravelControllerScanner` to project the resource-return facts already present in the parsed action descriptor. It does not construct invocation judgments or resolve a `ResourceDefinition`.
- Advanced the controller scanner contract version to 9 and boundary contract version to 46. Exported the evidence type from the package root.
- Added a focused static audit under `scripts/audits/` and updated the prior controller/resource audits.

## Remaining migration gate

This is an upstream evidence-contract improvement, not the end-to-end resource cutover. `laravelSourceAstPipeline.ts` still invokes `ControllerScanner.scanCanonicalBundle()` and `ResourceScanner.scanCanonicalBundle()`. The next step is to implement `LaravelResourceScannerInterface` so its authority consumes the retained source-correlated resource evidence plus canonical model/relation facts, preserves resolved/unresolved/ambiguous judgments, and returns AST/definition/judgment as one artifact. Only after production consumers use that artifact can the legacy controller-index/resource scanner path be removed.

## Verification

Static audits only. Build, typecheck, and E2E were not run.
