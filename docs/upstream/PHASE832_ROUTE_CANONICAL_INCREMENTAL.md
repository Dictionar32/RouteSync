# Phase 832 — Canonical Route Incremental Cutover

## Objective

Remove the CLI duplicate route producer from the active path. Route semantics remain owned by the existing core `RouteSemanticFlow` / `RouteManifest` authority.

## Changes

- Removed `RouteSemanticFlowFactory` from the active CLI incremental orchestrator.
- Removed the CLI route-resolver invocation from `resolveManifestIncrementally`; the scanned core manifest already carries canonical route semantics.
- Removed public CLI exports of the legacy route factory and legacy route-flow alias.
- Preserved `scannedRouteDescriptor.ts` and `scannedManifestDescriptor.ts` as empty files rather than deleting them.
- Updated manifest drift auditing to consume core `RouteSemanticFlow` and nested semantic coordinates instead of the former flat route descriptor.
- Added `audit:phase832-route-canonical-incremental`.

## Trace Result

- CLI `RouteSemanticFlowFactory` production references: `0`.
- External core `RouteSemanticFlowFactory` production references: `0`.
- Preserved legacy route descriptor files: present and empty.
- Canonical CLI consumers use `@routesync/core` `RouteSemanticFlow`.

## Important Boundary

The remaining `packages/cli/src/utils/incremental/*` modules for model/resource/IR resolution are not route producers. The former route-specific resolver files remain isolated for later consumer/test cleanup; they are not imported by the active incremental orchestrator.

## Next Frontier

Trace the remaining incremental model/resource/IR path and SDK tests independently. Do not recreate a CLI route factory or compatibility adapter. Only empty remaining legacy files after external reachability reaches zero.
