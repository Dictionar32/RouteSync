# Phase 1081 — Manifest Flow Kind Closure

## Change

`RouteSyncManifestFlow.kind` is now closed to `route_sync_manifest_flow`.

The concrete `RouteSyncManifest` remains the construction-side contract and
retains `kind: 'route_sync_manifest'` plus `CompleteSourceAst`.

## Reason

`RouteSyncManifestFlow` is the downstream semantic handoff. Allowing the
construction-side kind on the downstream flow weakened the AST-free boundary
and made the two contracts structurally indistinguishable by discriminator.

The ownership remains:

```text
RouteSyncManifest (upstream construction)
        |
        v
RouteSyncManifestFlowProjectionInterface (downstream wiring)
        |
        v
RouteSyncManifestFlow (downstream semantic contract)
```

No CLI producer or legacy scanner was changed by this phase.
