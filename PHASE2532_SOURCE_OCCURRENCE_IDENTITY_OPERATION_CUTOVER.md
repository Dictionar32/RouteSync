# Phase 2532 — Source Occurrence Identity Operation Cutover

## Scope

This change closes one concrete identity ownership defect in the Phase 2531 snapshot: the upstream inventory produced occurrence keys, while the source-occurrence verifier independently reconstructed the same keys from coordinates. The two paths could drift as the occurrence identity policy evolves.

## Implementation

- Extended the existing `RequestTypeDerivationSourceEvidenceInventoryInterface` with canonical occurrence-key operations for route, resource, and request source locations.
- Made the inventory producer create each occurrence key through those operations.
- Changed source-occurrence verification to recompute expected keys through the same upstream operations instead of maintaining a second `${file}:${start}:${end}` implementation.
- Added `audit:phase2532-source-occurrence-identity-operation` to verify ownership and wiring.
- Did not add dependencies on `semantic/foundation` or `semantic/relations`; did not introduce duplicate identity interfaces.

## Validation

- Phase 2530 semantic identity audit: 24/24 passed.
- Phase 2531 endpoint identity audit: 11/11 passed after updating its assertion to the new canonical occurrence operation.
- Phase 2532 source occurrence operation audit: 13/13 passed.
- Full TypeScript check was attempted with the globally installed TypeScript 5.8.3 and could not run: the repository config uses target/lib values unsupported by TS 5.8.3, and the existing `effectiveControllerActionPolicyResolver.phase921.test.ts` has syntax errors at lines 47 and 221. No local `node_modules` are present, so package tests/build were not run.

## Explicitly unresolved root cause

This is an identity ownership repair, not a claim that RequestType semantic derivation is fully closed. The active `routeManifestTypeLowering.ts` still invokes `requestTypeDerivationProjectionPipeline.derive(...)`, which reaches the legacy solver and returns `RequestType[]`. The production semantic reasoning producer and independent verifier for all 32 derivation laws are still missing from the snapshot. No legacy output was relabeled as a verified judgment and no fake proof was manufactured.
