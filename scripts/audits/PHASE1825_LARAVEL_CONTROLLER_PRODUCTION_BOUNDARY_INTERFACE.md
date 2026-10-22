# Phase 1825 — Laravel Controller Production-Boundary Interface

## Objective

Strengthen the upstream interface before production wiring. This phase changes contracts only; it does not claim that `ControllerScanner` has already been replaced.

## Trace findings

- `LaravelControllerScannerInterface` previously accepted a raw `PhpSourceInvocationSemanticPipelineDeliveryBatch` wrapper. That did not encode the controller-source-to-result pairing as an input contract.
- `LaravelControllerInvocationSemanticJudgmentAuthorityInterface` already composes source-binding and integration interfaces, and its judgment keeps `sourceFile` and integrated `response` together.
- The production pipeline at `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` still invokes `ControllerScanner.scanCanonicalBundle()` and passes a legacy batch. Route and resource consumers still depend on the controller index.

## Contract changes

- Raise `LaravelControllerScannerInterface` and `LaravelControllerScanJudgment` to contract version 4.
- Inject `LaravelControllerInvocationSemanticJudgmentAuthorityInterface` into the scanner contract.
- Replace the uncorrelated delivery batch input with a closed source-correlated inventory. Each entry explicitly states a `controllerSourceFile` and either its pipeline result or a typed not-provided state.
- Keep `LaravelControllerInvocationSemanticJudgmentInterface` as the single artifact value carrying source identity and the exact integrated response.
- Raise `LaravelControllerInvocationSemanticBoundaryContract` to version 40 and document authority injection, per-source delivery, judgment correlation, and the production-conformance gate.
- Export `LaravelControllerInvocationSourceDelivery` from the package root.

## Explicit non-goals

- No production wiring migration in this phase.
- No changes to `ControllerScanner` implementation.
- No subscanner deletion while route/resource and pipeline consumers remain active.
- No build/typecheck/E2E execution.

## Audit

Run `node scripts/audits/audit-phase1825-laravel-controller-production-boundary-interface.cjs`.
The audit checks the interface and export contracts and explicitly verifies that the production trace still exposes legacy wiring, preventing a false claim of completed migration.

## Superseded by Phase 1826

Phase 1826 removes the callable authority and raw pipeline evidence from the scanner input. The current audit is retained as a regression entry point but now checks the evolved judgment-only boundary instead of requiring the superseded raw-delivery contract.
