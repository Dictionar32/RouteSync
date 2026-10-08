# Phase 982 — Migration provenance through semantic relation graph

Phase 982 closes the provenance gap between migration-derived schema evidence and the canonical model-relation graph edge.

## Trace

```text
MigrationAst
  -> MigrationInterface
  -> SchemaInterface
  -> SchemaTable.migrationProvenance
  -> SchemaRelationInterface
  -> SchemaForeignKeyEvidence
  -> SemanticRelationReconciliationInterface
  -> ModelSemanticRelation.provenance
  -> StructuralSemanticRelation
  -> GraphEdgeRelation.provenance.lineage
  -> GraphEdgeRelationSink
```

`SemanticDataflowInterface` remains a separate closed semantic authority. Migration provenance is not injected into the generic dataflow solver merely to carry metadata. The manifest continues to provide seed inputs only, while the sole `createSemanticDataflowJudgment()` authority owns fixed-point closure.

## Changes

- `SchemaRelationInterface` now preserves table source and migration provenance.
- `SchemaForeignKeyEvidence` is a typed closed evidence projection of a schema foreign key and its migration lineage.
- `SemanticRelationReconciliationInterface` now exposes the exact schema evidence used for reconciliation.
- A matched `ModelSemanticRelation` carries `ModelRelationProvenance` without reopening migration AST.
- Graph model-relation provenance preserves that typed lineage through `GraphEdgeRelation`.
- No second dataflow solver, manifest solver, or generic `unknown` provenance field was introduced.

## External architecture trace

Laravel documents migrations as the version-controlled database schema definition and foreign-key constraints as semantic referential-integrity information. CodeQL separates AST structure from semantic dataflow graph nodes. MLIR uses interfaces to decouple generic analyses from concrete operations and keeps fixed-point iteration inside its dataflow solver. RouteSync follows the same separation: migration/schema semantics remain upstream, graph projection preserves lineage, and dataflow closure remains singular.
