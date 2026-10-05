# Phase 860 — Graph Edge Consumer Boundary

## Trace result

The canonical graph-edge path now has a closed producer/materialization boundary:

```text
GraphEdgeRelation
  -> GraphEdgeRelationSink.accept()
  -> GraphEdgeRelationSink.materialize()
  -> ServiceDependency[]
  -> assembleServiceGraph()
  -> ServiceGraph.edges
```

The source-model compiler does not bypass this boundary.

## Consumer trace

The current repository has two intentional `ServiceGraph.edges` consumers:

1. `packages/cli/src/commands/scan.ts` serializes the complete `ServiceGraph` to `routesync.graph.json`.
2. `packages/cli/src/commands/audit/semanticAuditor.ts` reconstructs `ServiceGraph` from the serialized graph for audit reporting.

The semantic resolution kernel currently loads only `VerifiedModelGraph.models`; it does not consume `ServiceGraph.edges`. Therefore this phase does **not** incorrectly invent a second semantic consumer for service graph edges.

The existing generic `DependencyGraph` / closure / SCC utilities are a separate compiler dependency graph substrate and are not silently connected to `ServiceGraph.edges`.

## Hardening

`ServiceGraph.edges` is now a readonly relation projection and `assembleServiceGraph()` freezes the projected edge collection. This prevents downstream mutation from becoming an implicit third graph authority.

`GraphEdgeRelationSink.materialize()` already freezes each projected `ServiceDependency` and the containing relation collection.

## External comparison

CodeQL treats graph edges as an explicit relation used by path analysis; MLIR builds and evolves a dependency graph as an analysis substrate; Soufflé treats relations as sets of tuples and can attach provenance to derived tuples. RouteSync should adopt those ideas only where the local source trace establishes an actual semantic consumer. It should not introduce a synthetic closure/SCC path merely because those systems have one.
