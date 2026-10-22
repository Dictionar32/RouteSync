# Phase 2600 — Manifest Preflight Public Contract Closure

## Scope

This phase closes a specific public API gap between the completed upstream manifest and the resolution-only preflight. It exports the existing `RouteManifestProjectionInput`, `RouteManifestRequestResolutionPreflight`, and `RouteManifestRequestResolutionPreflightInterface` through `packages/core/src/index.ts`.

## Trace

`RouteSyncManifest` → `routeManifestRequestResolutionPreflight.evaluate(manifest)` → `routeFlowsFromManifest` / `resourceAstsFromManifest` / `requestAstsFromManifest` → `requestTypeDerivationSourceEvidenceInventory.inventory(input)` → request and resource resolution ledgers → their assessments → preflight packet.

Both ledgers consume the same inventory instance. The packet preserves the exact manifest and semantic input, plus source evidence and resolution receipts.

## Architectural boundary

This is a resolution preflight, not a `RequestTypeDerivationJudgment`, not a proof verifier, and not evidence that all 34 derivation laws are satisfied. The semantic producer and independent complete verifier remain missing as production capabilities. This phase intentionally does not synthesize them from the legacy `RequestType[]` projection.

## Change

- Added public type exports for the preflight packet and operation interface, plus the projection input type.
- Added `scripts/audits/audit-phase2600-manifest-preflight-public-contract.cjs` to check the exports, shared inventory wiring, existing upstream operation contract ownership, and non-claim of semantic proof closure.

## Validation

The phase audit checks structural wiring only. Full TypeScript typecheck, Vitest, package build, and real Laravel integration remain unverified in this environment.
