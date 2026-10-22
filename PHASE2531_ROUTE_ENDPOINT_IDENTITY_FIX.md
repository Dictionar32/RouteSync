# Phase 2531 — Route Endpoint Identity Fix

## Provenance and scope

This patch is based on the available `RouteSync-Phase2530-Route-Evidence-Semantic-Identity.zip` snapshot. It is not applied to the user's current local working tree. It fixes a concrete upstream identity collision and adds a static regression audit. It does not claim full semantic producer closure.

## Root cause

The upstream `canonicalRouteIdentity` operation used only `routeName` to create the semantic key (`route:<name>`). Two routes with the same declared name but different HTTP methods, paths, resources, domains, or groups could therefore receive the same semantic identity. The verifier consistently called the canonical operation, but consistency alone could not repair an identity function that discarded endpoint coordinates.

## Source fix

`packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts` now derives the canonical route semantic key from the full endpoint coordinate tuple:

- HTTP method
- declared path
- route name
- resource
- domain
- group

Each component is URI-encoded before delimiter composition, preventing a delimiter inside a component from aliasing another tuple. The identity remains owned by the existing `canonicalRouteIdentity` operation and the existing `RequestTypeCanonicalRouteIdentity` ADT; no duplicate interface or alternate resolver was added.

Source occurrence identity remains separate: `route-occurrence:<file:start:end>` continues to identify a source declaration occurrence. Semantic endpoint identity and source location identity therefore serve different purposes and are not conflated.

## Validation performed

- Existing `audit:phase2530-route-evidence-semantic-identity`: **24/24 assertions passed** after the source change.
- New `audit:phase2531-route-endpoint-identity`: intended to verify the full endpoint tuple, encoding, occurrence-key separation, and shared canonical operation.
- TypeScript syntax transpilation is performed separately for the modified TypeScript source.
- Full typecheck, Vitest suite, package build, and CLI integration are not claimed as passed. The snapshot has no installed dependencies and is not the user's current local workspace.

## Remaining architectural root cause

`packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts` still calls `requestTypeDerivationProjectionPipeline.derive(...)`, producing `RequestType[]` through the legacy projection path. The authority-backed manifest path requires a real `RequestTypeDerivationSemanticPipelineInterface` provider; the snapshot does not show a complete production reasoning + proof-verification composition wired into the active CLI path.

This identity fix is a real upstream correction, but it does not complete semantic judgment production, proof verification, inventory disposition closure, or authority-backed active manifest wiring. Do not mark those areas fixed until the producer/verifier are implemented and the CLI consumes their closed judgment without legacy fallback.
