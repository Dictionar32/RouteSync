# Phase 984 — Dataflow Origin Lineage Closure

Phase 984 menutup provenance drop pada boundary `SemanticDataflowJudgment -> SemanticDataflowInterface`.

## Trace

`MigrationInterface -> SchemaInterface -> SchemaRelationInterface -> SemanticRelationReconciliationInterface -> ModelSemanticRelation -> GraphEdgeRelation -> SemanticDataflowInput -> SemanticDataflowJudgment -> SemanticDataflowInterface -> IR/Manifest`

## Change

`semanticDataflowInterfaceFromJudgment()` menerima optional `SemanticDataflowOrigin`. Production analysis sekarang meneruskan `input.origin` ketika membungkus judgment, sehingga typed semantic lineage tidak hilang pada interface boundary.

The scanner adapter now emits a closed controller lineage with the canonical `SourceSpan`. No AST, migration implementation, graph implementation, or second solver enters the dataflow algebra.

## External design alignment

Laravel treats migrations as the versioned schema definition and foreign keys as referential-integrity semantics. CodeQL separates semantic dataflow nodes/paths from AST structure. MLIR keeps generic interfaces decoupled from concrete IR operations and centralizes fixed-point execution in the dataflow solver. RouteSync follows the same ownership split.

## Audit

- `scripts/audits/audit-phase984-dataflow-origin-lineage.cjs`
- Phase 983 semantic provenance audit remains clean.

Full TypeScript build/test is not claimed because the checkpoint environment still lacks the required local type-definition/dependency set.
