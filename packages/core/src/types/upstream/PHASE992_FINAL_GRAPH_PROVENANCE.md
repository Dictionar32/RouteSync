# Phase 992 — Final ServiceGraph Graph-Relation Provenance Proof

Phase 992 closes the remaining executable-proof gap after Phase 991: the ecommerce fixture is now tested through the final `ServiceGraph.edgeRelations` collection rather than only through intermediate structural relations or the compatibility `edges` projection.

## Canonical proof

```text
Laravel migration
  order_details.order_id -> orders.id
        |
        v
SchemaRelation / FK evidence
        |
        v
OrderDetail::belongsTo(Order::class)
        |
        v
ModelSemanticRelation
        |
        v
GraphSemanticRelation / GraphEdgeRelation
        |
        v
GraphEdgeRelationSink
        |
        v
ServiceGraph.edgeRelations
```

The Phase 992 executable test asserts:

- `OrderDetail -> Order` exists in the final canonical `edgeRelations` collection.
- The edge origin is `model_relation`.
- Graph provenance points to the exact upstream `ModelSemanticRelation` instance.
- Model-relation lineage contains migration provenance from `2026_02_09_084356_create_order_details_table.php`.
- The compatibility `ServiceGraph.edges` projection still contains the same edge.

## Ownership boundary

`GraphSemanticRelation` remains owned by `packages/core/src/types/upstream/graphRelation.ts`.

`graph/service/graphEdgeRelation.ts` remains an implementation alias/constructor only.

`GraphEdgeRelationSink` remains the sole graph-edge materialization authority. `ServiceGraph.edgeRelations` is canonical; `ServiceGraph.edges` is compatibility materialization and intentionally omits provenance.

No migration-to-dataflow interface or second dataflow solver is introduced.

## Audit

`node scripts/audits/audit-phase992-final-graph-provenance.cjs` is green.

Phases 981 through 992 relevant static audits are green.

Full TypeScript/Vitest execution remains unavailable in this workspace because `node_modules/.bin/tsc` and `node_modules/.bin/vitest` are absent. The Phase 992 test is therefore added as the executable proof to run once the project toolchain is restored.

The legacy `packages/core/src/compiler/scanner/subscanners/model/migrationScanner.ts` remains physically present and empty.
