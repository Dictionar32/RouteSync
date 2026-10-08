# Phase 975 — Upstream Reconciliation Interface

The relation boundary is now canonical rather than declarative-only.

## Pipeline

`MigrationAst -> SchemaInterface -> SchemaRelationIndexInterface -> SemanticRelationReconciliationInterface -> ModelRelationInterface -> ModelSemanticRelation -> SemanticDataflowInput -> SemanticDataflowJudgment -> Manifest`

Route binding remains independent:

`RouteDefinition -> RouteBindingInterface`

## Corrections

- `reconcileSemanticRelation` is the single Eloquent/schema relation reconciliation authority.
- `ModelRelationInterface` now carries reconciliation judgments, not only raw evidence.
- `modelSemanticDefinition` constructs the relation interface once and reuses its semantic relations for both the model surface and relation index. There is no second relation construction path.
- Reverse `hasMany`/`hasOne` convention uses the source model's conventional foreign key (`order_id` for `Order::details()`), not the relation method name.
- `RouteBindingInterface` exposes implicit model, explicit/custom, and scoped binding surfaces separately.
- Manifest remains seed-only and dataflow fixed-point ownership remains in `SemanticDataflowJudgment`.

## Evidence discipline

Schema FK evidence proves referential linkage. Eloquent relation evidence determines traversal/cardinality. Route binding evidence is independent. Reconciliation records `matched`, `ambiguous`, `conflict`, or `eloquent_only` rather than silently forcing a key.
