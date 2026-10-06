# Phase 1123 — Graph Interface Ownership Trace

## Direction

`upstream => wiring => interface => downstream`

## Finding

`GraphSemanticRelation` was stored under `types/upstream/graphRelation.ts` even though it is a graph-edge materialization contract produced by the downstream graph projection from canonical `SemanticRelation`.

That placement blurred ownership: upstream semantic vocabulary appeared to own a downstream graph representation.

## Fix

`GraphSemanticRelation` and its graph node/edge/origin vocabulary now live at:

`packages/core/src/graph/service/graphRelation.ts`

The upstream index no longer exports `graphRelation`.

The graph layer imports canonical upstream inputs (`ModelSemanticRelation`, provenance, and semantic references), while upstream has no dependency on graph/service.

## Conserved path

```text
Laravel source evidence
  -> upstream semantic references / contracts / relations
  -> RouteSyncManifestFlow
  -> RouteSyncManifestGraphSurface
  -> graph/service structural relation projection
  -> GraphEdgeRelation / ServiceGraph
```

`SemanticRelation` remains the semantic authority. `GraphSemanticRelation` is a downstream representation.

## Dataflow

`DataFlowInterface<Input, State, Node>` remains generic. Semantic closure is constructed once by the upstream authority at `seed`; `derive` and `close` are identity-preserving adapters over an already-closed judgment. IR reads `dataflow.state.closure` and does not reconstruct closure.

## Legacy

Production `StaticLaravelScanner` / `LaravelScanner` references remain empty.

## Fixture

`examples/ecommerce-shop-source` remains the conservation fixture covering routes, controllers, models/model relations, resources, and schema/migrations.
