# Phase 859 — Graph Edge Sink Closure

## Frontier

The Phase 858 graph-edge relation projection is now closed at the graph materialization boundary.

## Authority

`GraphEdgeRelationSink` remains the sole relation-to-graph-edge projection authority. `compileGraphFromSurface()` no longer reads the raw `GraphEdgeRelation[]` collection and no longer calls `assembleServiceGraph()` directly.

`ServiceGraphBuilder.getGraph()` is the only builder-owned finalization path:

```text
GraphEdgeRelation
  -> GraphEdgeRelationSink.accept()
  -> GraphEdgeRelationSink.materialize()
  -> ServiceDependency
  -> assembleServiceGraph()
  -> ServiceGraph
```

The compiler only emits canonical relations and delegates finalization to `GraphBuilderContext.buildGraph()`.

## Closed boundary

The compiler context no longer exposes `edgeRelations`. This prevents a second projection path from `GraphEdgeRelation` directly into `ServiceGraph` and prevents `GraphEdgeRelationOrigin` metadata from leaking through structural typing.

## Audit

`audit-phase859-graph-edge-sink-closure.cjs` verifies:

- compiler cannot read raw `edgeRelations`;
- compiler cannot call `assembleServiceGraph()`;
- compiler finalizes through `buildGraph()`;
- `ServiceGraphBuilder` owns exactly one `GraphEdgeRelationSink`;
- builder materializes through the sink;
- builder alone assembles `ServiceGraph` from `ServiceDependency[]`;
- sink projects relations to `ServiceDependency[]`;
- assembler accepts only projected graph edges.
