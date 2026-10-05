# Phase 858 — Graph Edge Relation Projection

## Frontier

Graph-edge derivation is now represented as a canonical `GraphEdgeRelation` before graph materialization.

## Authority

`GraphEdgeRelationSink` is the sole graph-edge materialization authority. Compiler code no longer calls `linkGraph` or mutates the final graph edge collection directly.

## Closed origin vocabulary

Every edge relation carries one of:

- `service_dependency`
- `controller_dependency`
- `model_relation`
- `resource_model_dependency`

This keeps graph-edge derivation traceable to its semantic producer.

## Flow

```text
canonical source relation
  -> GraphEdgeRelation
  -> GraphEdgeRelationSink
  -> ServiceDependency projection
  -> ServiceGraph
```

The sink canonicalizes duplicate endpoint/type/weight edges before projection.

## Audit

`audit-phase858-graph-edge-relation-projection.cjs` verifies:

- closed graph-edge relation vocabulary;
- canonical graph endpoints;
- relation origin presence;
- compiler relation producers;
- zero direct `linkGraph` calls in the source-model compiler;
- one sink owned by `ServiceGraphBuilder`;
- sink materialization and deduplication;
- public export of the relation and sink.
