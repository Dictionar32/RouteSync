# Phase 1092 — Graph Controller/Route Surface Closure

## Goal

Close the remaining graph projection leakage after Phase 1091. Graph controller and route surfaces must be downstream-owned slices and must not retain nominal dependencies on the complete upstream `ControllerAction` or `RouteDefinition` shapes.

## Boundary

```text
RouteSyncManifestFlow
        │
        ▼
RouteSyncManifestGraphProjectionInterface
        │
        ▼
RouteSyncManifestGraphSurface
        ├── GraphModelSurface
        ├── GraphServiceSurface
        ├── GraphControllerSurface
        └── GraphRouteSurface
```

## Controller closure

`GraphControllerSurface` now contains only:

- `ControllerName`
- `ActionName`

The graph surface no longer references `ControllerAction['controller']` or `ControllerAction['action']`.

## Route closure

`GraphRouteSurface` now contains only:

- `RoutePath`
- `Option<ControllerReference>` for controller-route graph facts

The projection extracts controller targets upstream. The downstream graph compiler does not inspect the complete `RouteTarget` ADT or `RouteDefinition`.

## Semantic separation

Runtime/value-flow evidence remains in the generic `DataFlowInterface`. Structural model/controller/resource/schema relationships remain in the canonical `SemanticRelationGraph` and are projected through `GraphEdgeRelation`.

Laravel serialization may include loaded relationships, but that does not make every relationship a dataflow edge. Resource and relation evidence therefore remain separate semantic authorities.

## External validation

- CodeQL documents dataflow as a semantic value-flow graph distinct from the AST and supports generic source/sink/flow configuration.
- MLIR documents interfaces as a mechanism for generic analyses/transformations without encoding concrete dialect knowledge.
- Laravel 13 documents recursive serialization of loaded Eloquent relationships and route/controller serialization, reinforcing the need to keep serialization/resource evidence separate from the generic dataflow primitive.

## Build limitation

The local workspace does not provide `node_modules/.bin/tsc` or `node_modules/.bin/tsup`; therefore this phase is validated by structural audits and targeted source checks, not a full TypeScript/package build.
