# Phase 986 — E2E Semantic Lineage

Phase 986 closes the distinction between two valid provenance paths instead of conflating them:

1. Laravel migration FK provenance flows through `MigrationInterface -> SchemaInterface -> SchemaForeignKeyEvidence -> ModelSemanticRelation -> GraphEdgeRelation`.
2. Controller-scoped semantic dataflow provenance flows through `SemanticDataflowInput -> SemanticDataflowJudgment -> SemanticDataflowInterface -> SemanticDataflowIRProjection`.

The ecommerce fixture provides the concrete relation evidence:
`2026_02_09_084356_create_order_details_table.php` declares `order_id` with `foreignId(...)->constrained()`, and `OrderDetail.php` declares `belongsTo(Order::class)`.

This phase intentionally does **not** invent a model-relation dataflow seed. The canonical manifest surface currently defines dataflow inputs as controller-scoped semantic seeds. Graph relation provenance and dataflow lineage therefore remain separate typed projections of the same upstream semantic model.

No second dataflow solver is introduced. Manifest remains seed transport; the semantic dataflow judgment remains the sole fixed-point authority; IR remains a downstream projection.
