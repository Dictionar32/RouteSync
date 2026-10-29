# Phase 2807 — Manifest ADT Root-Cause Trace

## Decision

Phase 2806 removed the generic type parameter and `as never` from the consumer dispatch, but it did not remove the underlying branch. The `switch` was relocated into `routeManifestProjectionCompositionOutcomeOperations.consume`. This phase records the actual producer chain before changing any upstream contract; it does not claim the switch has been eliminated.

## Active runtime path

```text
packages/cli/src/commands/scan.ts | sync.ts
  -> composition.manifestScanOperation.scan(input)
  -> manifest scan / builder ADT
  -> routeManifestRequestResolutionPreflight.evaluate(completeManifest)
  -> routeManifestProjectionCompositionFactory.create(requestTypeDerivationPipeline).project(preflight, baseURL, version)
  -> authorityBackedRouteManifestProjectionFactory.create(pipeline).project(preflight)
  -> authorityBackedRouteManifestTypeLoweringFactory.create(pipeline).project(preflight)
  -> createRequestTypeDerivationOperationPreparation(...).prepare(preflight.semanticInput)
  -> pipeline.derive(input)
  -> pipeline.validateAssessment(assessment)
  -> RequestTypeDerivationRuntimeExecutionResult
  -> RequestType lowering / manifest composition / CLI persistence
```

## Actual branch sites and ownership

1. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts`
   - The `assessment.kind` switch converts the upstream authority assessment ADT into `RequestTypeDerivationRuntimeExecutionResult`.
   - This is the earliest active switch in the derivation-to-manifest path. It maps each verified or rejected authority assessment to a concrete runtime outcome. It is an ADT construction boundary, not CLI presentation logic.

2. `packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts`
   - The `derivation.kind` switch collapses `projected` versus the explicit non-projectable outcomes into `lowered | derivation_not_projectable`.
   - This is the immediate semantic branch causing the projection path to classify derivation outcomes.

3. `packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts`
   - The `lowered | derivation_not_projectable` switch converts the lowering result into `projected | not_projectable`.

4. `packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts`
   - The `projected | not_projectable` switch lowers a successful result to `RouteManifest` and converts the blocked result to `manifest_projection_blocked`.
   - `routeManifestProjectionCompositionOutcomeOperations.consume` then contains a second switch solely to eliminate the resulting manifest ADT for CLI consumers.

## Root cause

The same semantic decision is represented and translated through multiple adjacent ADTs:

`RequestTypeDerivationRuntimeExecutionResult` -> `AuthorityBackedRouteManifestTypeLoweringResult` -> `AuthorityBackedRouteManifestProjectionResult` -> `RouteManifestProjectionCompositionResult`.

The switches are symptoms of these repeated translations. Removing only the last switch relocates the elimination point; it does not address the repeated conversion boundaries.

## Existing upstream contracts reviewed

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` already owns `RequestTypeDerivationRuntimeExecutionResult`, `RequestTypeDerivationOperationPreparationInterface`, and `RequestTypeDerivationSemanticPipelineInterface`.
- `packages/core/src/types/upstream/manifest.ts` already owns the upstream `RouteSyncManifest` contract.
- `packages/core/src/types/upstream/manifestBuilderInterface.ts` already owns complete/blocked manifest-builder judgment.
- `packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts` already owns the exact preflight packet and downstream projection input boundary.

No new upstream interface is justified merely to hide a switch. A future source change should first decide whether the repeated projection result types are redundant and can be collapsed while preserving every derivation failure variant, evidence ledger, and derivation payload. Any contract evolution must happen at the owner that creates the semantic outcome, not by adding a generic visitor/fold, generic `<T>`, type assertion, or another adapter interface.

## Constraints retained

- `packages/core/src/types/upstream/collections.ts` must remain exactly 0 bytes.
- Runtime exports on the changed path remain interface-first frozen operation objects.
- No generic reasoning primitive or `as never` assertion is introduced.
- No blocked derivation may be projected as a successful or empty manifest.
- Explicit semantic ADTs and their evidence remain intact.

## Verification scope

This is a root-cause trace and contract audit. It does not claim the switches above are removed. Full typecheck, build, complete tests, and CLI E2E must be run after a contract redesign, not inferred from structural audit success.
