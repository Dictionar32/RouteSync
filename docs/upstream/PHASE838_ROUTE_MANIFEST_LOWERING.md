# Phase 838 — RouteManifest lowering boundary

## Objective

Restore a typed downstream lowering boundary after the scanner was elevated to
`RouteSyncManifest`. The CLI must no longer treat the upstream manifest as a
`RouteManifest`, use `any`, or cast it through `unknown`.

## Canonical flow

```text
StaticLaravelScanner
  ↓
RouteSyncManifest
  ↓
canonical RouteBoundaryContract from RouteEmission
  ↓
RouteSemanticFlow (structural semantic projection)
  ↓
existing TypeDeriver / compiler RouteManifest
  ↓
ManifestGenerator / CompilerBridge
```

`RouteSemanticFlowFactory` is not used by this lowering path. The route
boundary contract produced by `routeProducerRelations` is the existing
semantic authority; the flow is only assembled from its closed subcontracts.

## CLI changes

`scan.ts` and `sync.ts` now call
`lowerRouteSyncManifestToRouteManifest()` directly. They no longer:

- assign the upstream scanner result to `any`;
- call `resolveManifestIncrementally()`;
- cast the upstream result as `unknown as RouteManifest`.

The CLI route display also reads canonical nested route coordinates and
capability state.

## Preserved legacy policy

No legacy files were deleted. The incremental compatibility implementation and
legacy route factory remain in the tree for independent reachability cleanup.
The Phase 838 production command path does not depend on them.

## Verification

`audit:phase838-route-manifest-lowering` checks:

- command-level legacy incremental boundary references are zero;
- external production references to `RouteSemanticFlowFactory` are zero;
- canonical lowering is exported;
- route boundary projection is reused;
- `ManifestGenerator` remains a downstream compiler assembler.

A full TypeScript build was not claimed because this workspace does not contain
`node_modules`.
