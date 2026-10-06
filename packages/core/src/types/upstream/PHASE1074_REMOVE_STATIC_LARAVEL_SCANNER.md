# Phase 1074 — Remove StaticLaravelScanner

`StaticLaravelScanner` is removed completely. It was only a legacy orchestration facade after the canonical `ManifestBuilderInterface` became the upstream producer.

## Canonical path

```text
Laravel source
  -> upstreamManifestBuilder / ManifestBuilderInterface
  -> RouteSyncManifest
  -> SemanticDataflow authority
  -> downstream wiring
       -> DataFlowInterface
       -> ServiceGraphBuilderInterface
       -> SemanticDataflowIRProjectionInterface
```

The generic `DataFlowInterface` remains domain-neutral. `InterfaceDependencyBoundary<Upstream, Downstream>` remains downstream-owned and directional. Graph consumes `RouteSyncManifestFlow`; IR alone specializes the boundary through `DataFlowProjectionInterface` because its upstream value is genuinely a `DataFlowInterface`.

Historical phase documents may mention the removed facade; they are retained as historical records and are not public/runtime dependencies.
