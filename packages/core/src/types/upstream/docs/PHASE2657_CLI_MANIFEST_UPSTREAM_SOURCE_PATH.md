# Phase 2657 — CLI / manifest / upstream source-path audit repair

## Root cause found

The current repository had historical audits that no longer described the source tree:

- Phase 2530 and 2531 tried to read `packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts`, even though Phase 2588 had moved runtime inventory implementation into `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts` so `types/upstream` remains the contract/type owner.
- Those audits also referenced the retired `packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts`; the current path is `routeManifestRequestResolutionPreflight.ts` → `routeManifestProjection.ts` / `routeManifestProjectionComposition.ts` → `routeManifestTypeLoweringAuthority.ts`.
- Phase 2650/2651 still asserted that no concrete reasoning producer existed, even though Phase 2656 had added a narrow producer and verifier slice. The correct status is partial implementation plus explicit gaps, not “no producer” and not “production complete.”

These stale assertions caused audits to fail before they could test the current path. Updating the assertions is not a semantic implementation fix; it makes the audit truthful about the current source layout.

## Current path

```text
CLI entry
  -> loadRouteSyncStandaloneComposition
  -> createProgramFromSemanticComposition
  -> composeRouteSyncCliUpstream
       ├─ controllerInvocationManifestCompositionAuthority
       └─ assembleRequestTypeDerivationProductionPipeline
  -> scan/sync command
  -> manifestComposition.compose(...)
  -> routeManifestRequestResolutionPreflight.evaluate(manifest)
       -> routeFlowsFromManifest / resourceAstsFromManifest / requestAstsFromManifest
       -> requestTypeDerivationSemanticInputPreparation.prepare(input)
            -> requestTypeDerivationSourceEvidenceInventory
            -> request resolution ledger + assessment
            -> resource resolution ledger + assessment
  -> createRouteManifestProjectionComposition(pipeline).project(...)
  -> createAuthorityBackedRouteManifestProjection(pipeline)
  -> createAuthorityBackedRouteManifestTypeLowering(pipeline)
  -> operationPreparation.prepare(preflight.semanticInput)
  -> semantic pipeline assembler
       -> preparation -> reasoning -> verifier -> decision -> authority integrity
  -> manifest projection only for a projectable verified judgment
```

## Implemented slice

The runtime inventory, preparation, CLI wiring, projection wiring, and `export const name: ExistingInterface` capability values are present. The reasoning producer currently handles a source-bound duplicate-canonical-identity rejection. The verifier independently recomputes that witness and preserves the exact inference envelope.

## Remaining root blocker — intentionally not hidden

The implementation is not production-complete. Collision-free inputs still hit a typed producer gap; non-duplicate judgments still hit a typed verifier gap; decision, authority adjudication, and integrity validation are typed gaps. Therefore the CLI can trace the path and fail at the precise unsupported semantic stage, but cannot yet produce a fully verified RequestType derivation for ordinary Laravel source input.

The next implementation phase must produce the full proof ledger from the existing AST/source inventory and resolution receipts, independently verify every canonical law, then implement the decision/authority/integrity algebra and test a real CLI scan/sync end to end. It must not wrap legacy `RequestType[]` output as a proof.
