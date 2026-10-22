# Phase 1877 — Laravel Invocation Judgment Direct Projection (Interface First)

## Trace finding
The canonical controller scanner was preserving the full `LaravelControllerInvocationSemanticJudgmentInterface`, but it also copied `judgment.response` into a separate `pipelineEvidence` field before passing it to the parser. That duplicated the integrated response outside the source-correlated judgment, weakening the stated ownership contract.

## Interface-first correction
- Advanced `LaravelControllerInvocationSemanticBoundaryContract` from v47 to v48.
- Advanced `LaravelControllerScannerInterface` and scan-judgment contract versions from v9 to v10.
- Added `integratedResponseProjectionBoundary`: the parser receives the integrated response directly from the correlated judgment, without a detached evidence copy.
- Scanner derives the source path from `invocationJudgment.sourceFile` and passes `invocationJudgment.response` directly to `parseControllerDeclaration`.
- Removed the redundant `InvocationPhpSourcePipelineInput` import from scanner wiring.
- Added a focused static audit for the new ownership rule.

## Validation boundary
The focused audit and historical invocation audits are run; JSON syntax, audit JavaScript syntax, and ZIP integrity are checked. No full build or TypeScript compilation is run.

## Audit results
- Phase 1877 focused audit: 9/9.
- Related controller/invocation regression audits (Phases 1836, 1843, 1870–1876, 1838, 1869): 132/132.
- Total selected static audit checks: 141/141.
- `package.json` JSON parse and `node --check` for the new audit passed.
- ZIP integrity checked after packaging.
- Full build and TypeScript compilation intentionally not run.
