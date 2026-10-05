# Phase 837 — Source Model Graph Cutover

## Objective

Move the `ServiceGraphBuilder` route-sync path from the downstream `RouteManifest` compatibility shape to the existing canonical `CompleteLaravelSourceModel.contracts` authority.

## Changes

- Added `compileGraphFromSourceModel()` to the existing graph compiler module. This is a graph compilation entrypoint over the canonical upstream semantic contract catalog, not an adapter or compatibility projection.
- `ServiceGraphBuilder.buildFromRouteSyncManifest()` now accepts only `RouteSyncManifest` and compiles directly from `manifest.sourceModel`.
- Model, resource, route, and service graph facts are read from `sourceModel.contracts`.
- CLI `scan` no longer casts the compatibility result to `RouteManifest` for graph construction.
- Existing `buildFromManifest(RouteManifest)` remains because `RouteManifest` is still a valid downstream compiler manifest for existing generator consumers.

## Deliberately preserved

`RouteManifest` was not deleted or emptied. It remains a downstream compiler contract. The cutover only removes its use as the second semantic input to the canonical route-sync graph path.

## Validation

Static Phase 837 audit passes. Full TypeScript build was not claimed because this workspace does not contain `node_modules`.
