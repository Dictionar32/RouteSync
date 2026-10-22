# RouteSync Phase 2566 — CLI Upstream Pipeline Delivery Injection

## Root cause

The active CLI manifest composition directly called `phpSourceInvocationSemanticPipelineDeliveryBatchFromResults` after invoking the injected source-analysis pipeline. That meant the source-bound result delivery transition was still a hidden module dependency rather than an explicit upstream operation in the composition contract.

## Change

- Added `PhpSourceInvocationSemanticPipelineDeliveryInterface` to `packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineDeliveryInterface.ts`.
- Added `phpSourceInvocationSemanticPipelineDelivery: PhpSourceInvocationSemanticPipelineDeliveryInterface`, a named operation that preserves the exact source-bound pipeline result ADTs in a closed delivery batch.
- Kept the prior function as a compatibility entry point, delegating to the named operation.
- Added `sourceInvocationPipelineDelivery` to `ControllerInvocationManifestCompositionDependencies` and wired it in the CLI composition root.
- Changed the active manifest path to call the injected operation, not the helper function directly.
- Changed the standalone batch wrapper to use the same named operation.
- Advanced the CLI composition reasoning contract to version 10 and recorded the explicit delivery transition.
- Added `audit:phase2566-cli-upstream-pipeline-delivery-injection`.

## Architecture effect

`source documents → injected source semantic pipeline → injected upstream delivery operation → source-bound judgments → inventory authority → validated receipt → injected manifest builder preparation`.

The delivery operation transports already-closed results. It does not infer or reconstruct semantic judgments.

## Validation boundary

The phase audit checks the upstream contract, named operation, public exports, dependency injection, active-path use, compatibility delegation, and TypeScript syntax transpilation. Full workspace typecheck, package build, Vitest, and end-to-end CLI execution are not claimed by this report.

## Remaining upstream blocker

This phase does **not** close the separate RequestType semantic-proof producer gap documented by the existing upstream audits: the active manifest projection still requires a production `RequestTypeDerivationSemanticPipelineInterface` implementation that produces a source-bound judgment and independently verifies the full 32-law contract. The legacy `RequestType[]` solver is not promoted into a fake verified judgment. The next root-cause phase must trace and implement the actual upstream proof-producing composition before claiming end-to-end interface-first manifest generation.
