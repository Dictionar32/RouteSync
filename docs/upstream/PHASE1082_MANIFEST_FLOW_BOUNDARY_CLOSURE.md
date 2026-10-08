# Phase 1082 — Manifest Flow Boundary Closure

## Change

`RouteSyncManifest` is no longer declared as a subtype of `RouteSyncManifestFlow`.
The two contracts are now sibling construction/semantic surfaces with distinct
closed discriminators:

- construction: `kind: 'route_sync_manifest'` + `CompleteSourceAst`
- downstream flow: `kind: 'route_sync_manifest_flow'` without AST

## Reason

Phase 1081 correctly closed `RouteSyncManifestFlow.kind`, but retaining
`extends RouteSyncManifestFlow` made the construction contract inherit a
conflicting discriminator. The boundary must be structurally closed, not merely
documented as closed.

## Ownership

```text
RouteSyncManifest
  (upstream construction + AST)
        |
        v
RouteSyncManifestFlowProjectionInterface
  (downstream wiring)
        |
        v
RouteSyncManifestFlow
  (AST-free semantic handoff)
        |
        +--> ServiceGraphBuilderInterface
        +--> SemanticDataflowRuntimeBoundary
        +--> SemanticDataflowIRProjectionInterface
```

The route manifest lowerer remains construction-side because it intentionally
reads the validated AST to preserve the existing route/model/resource/request
compatibility contract.

## Cleanup

The orphaned Phase 1070 audit and obsolete legacy-scanner audits from Phases 1065,
1067, 1068, 1069, 1072, and 1073 were removed because they still opened the
already-deleted `StaticLaravelScanner.ts`. Current closure is guarded by Phase 1082.
