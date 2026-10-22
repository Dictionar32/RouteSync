# Phase 2429 — Integrated RouteManifest Authority Operation

## What changed

Added `createIntegratedRouteManifestAuthority`, an explicit composition operation for the path:

`RouteSyncManifest → authority-backed projection → RequestType derivation runtime executor → closed projected judgment → existing RouteManifest lowerer → integrated RouteManifest`.

The semantic pipeline is mandatory injection. The operation does not create a producer, reclassify routes, reconstruct a judgment, or fall back to the legacy `RequestType[]` solver. A successful executor result is the only variant that can materialize an integrated manifest. Any non-projectable result is preserved as `manifest_derivation_blocked` together with source evidence and the exact runtime derivation result.

The new operation is exported from `packages/core/src/index.ts` and is guarded by `scripts/audits/audit-phase2429-integrated-route-manifest-authority.cjs`.

## Validation

Run:

`node scripts/audits/audit-phase2429-integrated-route-manifest-authority.cjs`

This is a structural integration audit, not a claim of full semantic producer closure.

## Remaining blocker

The existing repository still has no production implementation of the reasoning, independent verifier, decision, and authority capabilities required by `RequestTypeDerivationSemanticPipelineAssembler`. The default CLI path still uses `routeManifestTypeLowering.ts` → `requestTypeDerivationProjectionPipeline.derive(...)` until a genuine producer is implemented and injected into the CLI composition root. This operation therefore establishes the correct integrated-manifest authority boundary, but does not claim end-to-end CLI cutover.
