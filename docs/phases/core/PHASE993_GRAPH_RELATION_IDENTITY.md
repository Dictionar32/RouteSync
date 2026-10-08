# Phase 993 — Graph Relation Identity Closure

Phase 993 closes two graph-boundary identity defects found by tracing the upstream contract into the graph implementation.

## Fixes

1. `createGraphEdgeRelation()` now emits the canonical discriminant `graph_edge_relation`, matching `GraphSemanticRelation` in `types/upstream/graphRelation.ts`.
2. `GraphEdgeRelationSink` deduplication now includes `origin`, so relations with identical endpoints/type/weight but different semantic origins are not collapsed into one relation.
3. The ecommerce final graph provenance proof asserts the canonical graph relation discriminant.

## Boundary

```text
GraphSemanticRelation
        ↓
createGraphEdgeRelation
        ↓
GraphEdgeRelationSink
        ↓
ServiceGraph.edgeRelations
        ↓
ServiceGraph.edges (compatibility projection)
```

`GraphSemanticRelation` remains upstream-owned. The graph implementation does not redefine its semantic vocabulary.

## Dataflow / migration boundary

No new migration-dataflow interface or second solver was introduced. Migration remains structural schema evidence and dataflow remains the single semantic fixed-point analysis lane.

## Audit

- Phase 991 upstream graph/dataflow boundary: clean
- Phase 992 final graph provenance: clean
- Phase 993 graph relation identity: clean

Full `tsc`/Vitest execution remains unavailable because the checkpoint has no `node_modules/.bin/tsc` or `node_modules/.bin/vitest`.
