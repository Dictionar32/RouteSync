# Phase 2230 — Interface-first response descriptor retirement

## Root cause

The controller action contract required a `ResponseDescriptor` before the controller-wide integrated response pipeline had published source-correlated method response products. That forced a second derivation path through `resolveResponse()` and `resolveResponseAttributeAst()`, including filesystem class-name fallback and observed-return field merging.

## Change

- Removed `ControllerActionContract.response`; the field had no production consumer in the scanned action path.
- Removed `resolveResponse()` and its call to `resolveResponseAttributeAst()` from `controllerActionContract.ts`.
- Retired the implementation body in `responseAttributeScanner.ts`; the file intentionally exports no resolver while the subscanner migration proceeds.
- Kept the existing `LaravelControllerResponseSemanticPipelineInterface` as the canonical response authority. `laravelControllerScanner.ts` already calls `judgeIntegratedResponse()` and publishes the resulting response judgment on `LaravelControllerScanArtifact`; `responseScanner.ts` projects only the source-correlated method products through `methodResponseAstProjection`.
- Evolved the existing `LaravelControllerActionSemanticJudgmentContract` from version 27 to 28 and removed the response-descriptor derivation obligation. Remaining action coverage is still partial for unrelated body projection and resource-binding publication; this phase does not claim those debts are closed.
- Updated the existing subscanner retirement contract to record `responseAttributeScanner.ts` as emptied.

## Authority flow after this phase

`Controller method source evidence → LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse() → source-correlated LaravelControllerMethodResponseProduct → LaravelControllerMethodResponseAstProjectionInterface → response AST definitions`

The action contract retains only the response-reference judgment needed by action semantics. It no longer manufactures a competing response descriptor. Existing domain `ResponseDescriptor` types remain available to unrelated route compatibility consumers; they are not produced by the controller action resolver.

## Validation boundary

The Phase 2230 structural audit checks that the resolver import/call and action descriptor field are absent, the existing integrated pipeline remains wired, the action contract version matches its composition root, and the retired module has no resolver implementation. Full TypeScript type-check, Vitest, and package build were not run.
