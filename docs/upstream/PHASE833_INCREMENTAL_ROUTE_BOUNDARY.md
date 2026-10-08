# Phase 833 — Incremental Route Boundary Cutover

## Objective

Close the remaining CLI incremental route boundary around the canonical core `RouteSemanticFlow`. The incremental orchestrator already stopped invoking the duplicate CLI route producer in Phase 832; this phase removes the remaining active CLI route type/hash/response-resolver path without deleting legacy files.

## Canonical authority

`packages/core/src/types/domain/routes.ts::RouteSemanticFlow` is the only active route semantic type at the CLI incremental boundary.

## Changes

- `packages/cli/src/utils/incremental/incrementalTypes.ts` now re-exports the core `RouteSemanticFlow` directly.
- `scannedManifestTypes.ts` now types manifest routes with the core `RouteSemanticFlow`; the route field no longer uses a CLI contract/legacy route type and contains no `any`.
- Removed `calculateRouteHash` from the active incremental module and CLI public barrel. Route-specific hashing was a second producer-oriented path and is no longer part of incremental route semantics.
- Preserved but emptied the obsolete route helper/type files:
  - `packages/cli/src/utils/incremental/types/scannedRouteTypes.ts`
  - `packages/cli/src/utils/incremental/routeHasher.ts`
  - `packages/cli/src/utils/incremental/routeResolver.ts`
  - `packages/cli/src/utils/incremental/routeResponseResolver.ts`
- Updated the incremental collection regression test to exercise the still-active resource collection path without constructing a legacy route descriptor.
- Retired only the route-factory/manifest/hash portions of the SDK incremental higher-level regression suite; its active nominal atom, resource descriptor, and response ADT coverage remains.

## Verification

`node scripts/audit-phase833-incremental-route-boundary.cjs` passes with:

- canonical incremental route import: true
- canonical manifest route: true
- route field contains `any`: false
- manifest contains legacy route contract/type: false
- active incremental hash export: false
- production legacy route refs: `[]`
- preserved obsolete route helper files: all exist and are 0 bytes

The audit also reports remaining SDK tests that directly exercise the core legacy `RouteSemanticFlowFactory`. Those are intentionally left as a separate test-classification frontier; no mass replacement was performed.

## Build status

The workspace does not contain installed `node_modules`, so a full TypeScript/Vitest build cannot be claimed from this checkpoint. Static source audit is the verification performed here.

## Next frontier

Trace the remaining incremental model/resource/IR boundary. Do not recreate a route adapter or route hash compatibility layer. Separately classify SDK tests that still construct the core legacy factory, then migrate only tests whose semantic behavior is not already covered by canonical scanner/AST coverage.
