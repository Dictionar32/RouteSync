# Phase 1807 — PHP Invocation Projection Authority (Interface First)

## Trace finding

`invocationSemanticPipeline.ts` performed a semantic discriminant check on `phpSourceInvocationPipeline` and selected either an integration projection or a pending state. That meant the integrated-response composition owned a rule already suited to the upstream `PhpSourceInvocationSemanticPipelineIntegrationInterface`.

## Contract change

- `PhpSourceInvocationSemanticPipelineIntegrationInterface.project` now accepts the closed `PhpSourceInvocationSemanticPipelineCompositionEvidence` union.
- The integration authority owns the `not_connected` → pending rule, connected complete → validated batch rule, and connected blocked → pending rule.
- The composition dependency contract injects this interface.
- The integrated-response composition delegates projection in one call and no longer imports or branches on the pending state.
- Integrated-response composition contract advances to v15; projection contract advances to v2.

## Boundaries preserved

- Scanner forwards source-pipeline evidence and returns the integrated response.
- The exact source-pipeline evidence remains retained in the response.
- Blocked pipeline details remain available through that evidence; pending is only the legacy integration-state projection.
- No dependencies on `semantic/foundation` or `semantic/relations` were introduced.

## Verification

Static audits only. No build or TypeScript typecheck was run.
