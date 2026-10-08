# Phase 1086 — Graph Downstream Surface Closure

## Scope

The graph boundary previously accepted `RouteSyncManifestFlow` but the concrete builder immediately dereferenced `manifest.sourceModel`. This phase closes that implementation leak without changing the upstream semantic authority.

## Change

The graph lane is now:

```text
RouteSyncManifest
    │
    ▼
RouteSyncManifestFlow
    │
    ▼
RouteSyncManifestGraphProjectionInterface
    │
    ▼
RouteSyncManifestGraphSurface
    │
    ▼
ServiceGraphBuilderInterface
    │
    ▼
ServiceGraph
```

`RouteSyncManifestGraphSurface` contains the canonical semantic contract catalog plus the canonical semantic relation graph required by graph compilation. It contains no AST and is not a `CompleteLaravelSourceModel`.

The projection owns the only `RouteSyncManifestFlow -> RouteSyncManifestGraphSurface` wiring. `manifestGraphCompiler.ts` consumes only the surface.

## CLI

`scan` now performs:

```text
manifestBuilder.build()
    -> manifestFlow
    -> graphSurface
    -> graphBuilder.project(graphSurface)
```

The dataflow lane remains independently projected to `RouteSyncManifestDataflowSurface`.

## Semantic ownership

Model relations, controller/resource relations, route relations, and schema-derived structural provenance remain upstream semantic evidence. Graph materialization consumes their canonical semantic relation projection; it does not reinterpret Laravel syntax.

## DataFlowInterface

No change. The generic `DataFlowInterface` remains domain-neutral and is not widened with Laravel, graph, route, controller, model, resource, schema, or manifest concepts.

## StaticLaravelScanner

No reintroduction. The legacy scanner remains absent.

## Validation

Phase 1085 audit was updated to assert the new graph surface boundary, and Phase 1086 adds a dedicated graph-surface audit. Full TypeScript build is not claimed because local `tsc`/`tsup` binaries are unavailable in the workspace.
