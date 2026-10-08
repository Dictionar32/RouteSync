# Phase 985 — Dataflow IR Lineage Closure

Phase 985 closes the downstream provenance gap found after the semantic provenance work.

## Trace

`MigrationInterface -> SchemaInterface -> SchemaRelationInterface -> SemanticRelationReconciliationInterface -> ModelSemanticRelation -> GraphEdgeRelation -> SemanticDataflowInput -> SemanticDataflowJudgment -> SemanticDataflowInterface -> SemanticDataflowIRProjection`

## Closure

`SemanticDataflowInterface.origin` is now preserved by `projectSemanticDataflowToIR()`.

The IR projection therefore carries the same closed `SemanticDataflowOrigin` / `SemanticDataflowLineage` rather than reconstructing or dropping provenance.

The IR projection does not import migration interfaces, migration ASTs, schema implementations, or graph implementations. It remains a projection of the authoritative semantic dataflow judgment.

## Authority boundaries

- Migration/schema provenance remains upstream semantic evidence lineage.
- Graph materialization remains owned by `GraphEdgeRelationSink`.
- Dataflow closure remains owned by the single `SemanticDataflowJudgment` authority.
- IR remains a projection and does not derive `reaches` or run another solver.
- Manifest remains a seed/input transport surface.

## Fixture relevance

The ecommerce fixture's migration/model relation lineage remains upstream of dataflow. A controller dataflow input may carry typed semantic origin; the IR projection now preserves that origin instead of discarding it.

## Audit

`scripts/audits/audit-phase985-dataflow-ir-lineage.cjs` must report `clean: true`.
