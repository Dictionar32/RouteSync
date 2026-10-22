# Phase 2239 — Injected Evidence Authority and CLI Trace

## Scope

This phase improves the existing Laravel controller composition without creating a second body authority, request authority, relation layer, or foundation layer. It makes the existing body-judgment authority and request-evidence adapter explicit typed dependencies consumed by the action judgment implementation.

## Confirmed production path

`packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`
→ invocation semantic pipeline / invocation inventory
→ `LaravelControllerScannerExecutor.scanControllers`
→ `executionDependencies.actionJudgment.judge`
→ `bodySemanticJudgmentAuthority.judge` + `requestBindingEvidenceProjection`
→ **legacy remaining path** `scanControllerAction` → `resolveControllerActionContract`
→ action judgment publication
→ `actionExecution.execute` (identity-preserving judgment forwarder)
→ `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` with the exact invocation judgment
→ existing response AST projection receives the invocation/response judgment pair.

## What changed

- `LaravelControllerExecutionDependencies` explicitly carries the existing `ControllerBodySemanticJudgmentAuthorityInterface` and the existing AST-to-request-evidence adapter.
- The action judgment implementation consumes those named dependency bindings rather than directly invoking the imported implementation names.
- The existing response pipeline remains the only integrated-response owner.
- The action runtime executor still forwards the exact semantic judgment; it does not claim to execute generated target code.
- Added a structural trace audit with 10 assertions.

## What remains open (not mislabeled as complete)

- `scanControllerAction` and `resolveControllerActionContract` remain on the production derivation path.
- The current concrete body-authority implementation still originates in `subscanners/controller/controllerAstCanonical.ts`.
- Request AST evidence projection still originates in `descriptors/request/controllerActionContract.ts`.
- This phase is a typed dependency-injection cutover, not full subscanner retirement and not proof of a successful TypeScript build.

## Architectural reference

MLIR's official interface guidance recommends expressing compiler analyses and transformations through generic interfaces instead of encoding special knowledge about each concrete operation/dialect. RouteSync's relevant application is the same principle: the action path should consume existing semantic contracts, while concrete legacy AST derivation must be retired rather than hidden behind renamed functions. See the MLIR interfaces documentation and TypeScript's structural contract guidance.
