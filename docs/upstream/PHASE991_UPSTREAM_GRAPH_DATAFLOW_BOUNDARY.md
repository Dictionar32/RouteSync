# Phase 991 — Upstream Graph + Dataflow Boundary Closure

Phase 991 closes two upstream semantic boundaries identified by the Phase 990 trace.

## Graph

`GraphSemanticRelation` is now owned by `packages/core/src/types/upstream/graphRelation.ts`.
The graph implementation file `graph/service/graphEdgeRelation.ts` is only an implementation alias/constructor and no longer owns the semantic relation contract.

Canonical graph flow:

```text
StructuralSemanticRelation
  -> GraphSemanticRelation
  -> GraphEdgeRelationSink
  -> ServiceGraph.edgeRelations
  -> ServiceGraph.edges (compatibility projection)
```

`ServiceGraph.edgeRelations` preserves origin and model/migration provenance. `ServiceGraph.edges` remains the lossy compatibility projection.

## Dataflow

`SemanticDataflowLineage` now carries the exact `SemanticDataflowIdentity` of its semantic producer.
The controller adapter supplies the input node identity directly.

Canonical flow remains:

```text
SemanticDataflowInput
  -> SemanticDataflowJudgment
  -> SemanticDataflowInterface
  -> SemanticDataflowIRProjection
```

No second solver or migration-to-dataflow seed was introduced.

## Migration boundary

`MigrationInterface` remains semantic-only and contains no `MigrationAst`.
AST conversion remains owned by `migrationInterfaceAdapter.ts`.
Migration provenance remains semantic and continues through schema FK evidence and model relation provenance into graph lineage.

## Ecommerce proof surface

The ecommerce fixture continues to provide the proof chain:

```text
order_details.order_id
  -> orders.id
  -> OrderDetail::belongsTo(Order::class)
  -> ModelSemanticRelation
  -> GraphSemanticRelation
```

## Audit

`audit-phase991-upstream-graph-dataflow-boundary.cjs` checks the new ownership and lineage boundaries.
Relevant Phase 981–988 audits were updated only where their ownership assertion still pointed at the old graph implementation file.

The legacy migration scanner remains physically present and empty.

Full TypeScript/Vitest execution was not claimed because `node_modules/.bin/tsc` and `node_modules/.bin/vitest` are absent from the checkpoint.
