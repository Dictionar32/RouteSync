# Phase 1090 — Graph Model Node Surface Closure

Phase 1090 closes the remaining graph-side widening after the manifest graph surface was minimized.

## Change

`RouteSyncManifestGraphSurface` already projected only a graph-owned model slice, but `GraphModelSurface` still forwarded the complete `ModelSemanticDefinition` and `ServiceModelNode` stored that complete upstream semantic payload.

The graph contract now carries only the canonical model identity required for graph node materialization. Structural model relations remain owned by `SemanticRelationGraph`; schema/relation evidence is not duplicated into the graph node.

## Boundary

```text
RouteSyncManifest
  -> RouteSyncManifestFlow
  -> RouteSyncManifestGraphSurface
  -> ServiceGraphBuilderInterface
  -> ServiceModelNode
```

`DataFlowInterface` remains unchanged and domain-neutral.
`InterfaceDependencyBoundary<Upstream, Downstream>` remains downstream-owned and directional.

## Verification

- no production graph import of `ModelSemanticDefinition`
- graph model node stores `GraphModelNodeSurface`, not the complete upstream semantic definition
- graph projection forwards only model identity
- canonical structural relation graph remains the relation authority
- Phase 1089 regression audit remains green
