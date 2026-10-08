# Phase 983 — Semantic provenance closure and dataflow boundary

Phase 983 removes the remaining AST dependency from model-relation provenance and clarifies the migration/dataflow boundary.

## Trace

```text
MigrationInterface
  -> SchemaInterface
  -> SchemaForeignKeyEvidence
  -> SemanticRelationReconciliationInterface
  -> ModelSemanticRelation.provenance
  -> StructuralSemanticRelation
  -> GraphEdgeRelation.provenance.lineage
  -> GraphEdgeRelationSink

Controller/model semantic evidence
  -> SemanticDataflowInput
  -> ONE SemanticDataflowJudgment
  -> SemanticDataflowInterface
  -> IR / Manifest projection
```

`ModelRelationProvenance` is now purely semantic: it contains `SourceSpan`, schema foreign-key evidence, and migration provenance, but does not import `EloquentRelationAst`. The AST remains evidence at the reconciliation boundary.

`SemanticDataflowOrigin` may carry a closed typed semantic lineage, but the dataflow algebra does not import `MigrationInterface`, `MigrationAst`, schema implementations, or graph implementation types. Migration provenance therefore remains upstream relation/schema lineage rather than becoming a generic dataflow fact.

## Architecture rule

- migration/schema provenance is evidence lineage;
- model relation reconciliation consumes that evidence;
- graph projection preserves relation lineage;
- dataflow facts describe dependency/value flow only;
- the dataflow judgment remains the sole fixed-point authority;
- IR consumes the canonical judgment and never reconstructs closure.

This preserves the distinction documented by CodeQL between syntax structure and semantic dataflow graph, while following MLIR's interface/solver separation.
