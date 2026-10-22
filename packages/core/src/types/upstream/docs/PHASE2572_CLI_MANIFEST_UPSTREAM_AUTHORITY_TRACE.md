# Phase 2572 — CLI Manifest Upstream Authority Trace

## Current traced path

The older Phase 2538/2539 reports described a CLI path that directly reached `routeManifestTypeLowering.ts` and the legacy `RequestType[]` solver. That trace is stale for the current snapshot and must not be used as the current-path claim.

The current CLI path is:

```text
CLI scan/sync
  → resolve injected RequestTypeDerivationSemanticPipelineInterface
  → fail closed if the pipeline is absent
  → compose source manifest through injected ControllerInvocationManifestCompositionAuthorityInterface
  → routeManifestRequestResolutionPreflight.evaluate(manifest)
  → reject unresolved/conflicted request or resource resolution
  → projectRouteSyncManifestForRouteManifest(preflight, injectedPipeline)
  → createAuthorityBackedRouteManifestProjection(pipeline)
  → createAuthorityBackedRouteManifestTypeLowering(pipeline)
  → createRequestTypeDerivationOperationPreparation(pipeline, consumer)
  → pipeline.derive(input)
  → pipeline.validateAssessment(assessment)
  → project only a verified derived judgment
  → lower manifest and generate artifacts
```

## Root cause still open

The CLI wiring now requires the pipeline and the active authority-backed projection does not import the legacy solver. However, `requestTypeDerivationProductionComposition.ts` only assembles injected capabilities. It does not provide a production reasoning producer or complete independent verifier for the 34 laws in `REQUEST_TYPE_DERIVATION_LAW_IDS`.

The actual blocker is therefore upstream capability implementation/composition, not missing CLI injection. Required next work is:

1. Implement reasoning over `RequestTypeDerivationInput` and canonical source inventory, emitting a closed judgment with source receipts, group contribution receipts, closure and proof.
2. Implement an independent verifier that checks all 34 laws against input, judgment and proof and returns typed counterexamples. Never fill all law statuses with literals or trust producer assertions.
3. Connect the existing decision, authority and assembler with the same contract identity.
4. Add behavioral fixtures for derived, incomplete, conflict and invalid-input outcomes, including duplicate semantic identity at distinct source spans.
5. Run typecheck, build, unit tests and CLI end-to-end with an actual production composition.

Do not make the CLI default to the legacy solver while this is open. The CLI currently fails closed when the required composition is absent, which is intentional.

## Identity and operation contracts

`packages/core/src/types/upstream/requestTypeDerivationInterface.ts` owns the source-evidence inventory contract, canonical identity ADTs, occurrence keys, closed judgment variants and 32-law coverage type. `requestTypeDerivationSourceEvidenceInventory.ts` exports named `export const operation: ExistingInterface['operation']` operations for route/resource/request identities and source occurrence keys. The source-occurrence guard is a partial verifier decorator only; it does not replace the complete verifier.

## Validation boundary

`audit:phase2572-cli-manifest-upstream-authority-trace` checks the current source wiring, fail-closed composition, authority-backed projection, explicit non-derived outcomes, typed identity operations, and TypeScript syntax transpilation. It is a structural audit, not a full typecheck, package build, Vitest run, or CLI end-to-end test.
