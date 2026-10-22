# Phase 1860 — Resource integrated response source binding

## Trace finding

The resource scanner accepted the complete `LaravelControllerScanJudgment`, and the binding authority used that judgment to derive resource/model candidates. However, the returned `LaravelResourceScanJudgment` dropped the controller judgment. The interface's previous `invocationIntegration` declaration therefore described an intended invariant without carrying the object that made the invariant verifiable downstream.

## Interface-first change

- Advanced `LaravelResourceScannerInterface` and `LaravelResourceScanJudgment` to contract version 12.
- Added `controllerScan: LaravelControllerScanJudgment` to the returned closed resource scan judgment.
- The scanner returns `input.controllerScan` by identity; it does not reconstruct controller evidence, action arrays, or invocation responses.
- Added `sourceBinding` to `LaravelResourceIntegratedResponseContract` to make the source-correlated object binding explicit.
- Updated the existing Phase 1854 static audit with a source-binding assertion.

## Boundary retained

The resource scanner still performs AST projection only after the binding batch is closed. This change does not claim to eliminate the remaining projection branch or the semantic work still implemented by `resourceModelBindingAuthority.ts`. It makes the integrated-response contract real and inspectable before attempting those further migrations.

## Validation

Run the Phase 1854 audit and Phase 1853 retirement audit. No build, TypeScript typecheck, or end-to-end test is claimed by this phase.
