# Phase 1875 — Laravel Invocation Scanner Closed-Input Interface First

## Objective

Close the scanner-facing PHP invocation input boundary. The scanner must receive an upstream-integrated discriminated outcome, not a union that also permits raw composition evidence. The upstream composition now forwards that outcome unchanged and no longer invokes the PHP integration authority itself.

## Trace and changes

- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`: `InvocationPhpSourcePipelineInput` is narrowed to `PhpSourceInvocationSemanticPipelineIntegrationResult`; composition contract advances to v17 and declares the closed scanner-input boundary.
- `packages/core/src/types/upstream/invocationSemanticPipeline.ts`: composition forwards `input.phpSourceInvocationPipeline` without branching, projection, or reclassification; integration authority is no longer a composition dependency.
- `packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts`: analyzer only accepts the closed integrated result and no longer owns source-binding projection.
- `packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts`: source-binding evidence is projected by the upstream integration authority at the composition root before entering the scanner analyzer.
- Scanner parser defaults now preserve an explicit integrated `not_connected` outcome.
- Historical audits 1806–1808 were aligned with the current v10 integration contract and v17 composition boundary; Phase 1875 audit added.

## Semantics preserved

`not_connected`, `source_binding_rejected`, `complete`, and `blocked` remain separate variants. Complete and blocked outcomes preserve the closed source-binding receipt and exact pipeline result. No semantic/foundation dependency was added. No subscanner was deleted in this phase.

## Validation scope

Only targeted source audits, JavaScript syntax checks, JSON parsing, and ZIP integrity are run. No full build or TypeScript compilation is claimed.
