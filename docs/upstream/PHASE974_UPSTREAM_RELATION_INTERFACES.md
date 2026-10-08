# Phase 974 — Upstream Relation Interfaces

## Boundary

The upstream semantic pipeline now exposes narrow relation interfaces without introducing a second solver:

`MigrationAst -> SchemaInterface -> SchemaRelationIndexInterface -> reconciliation -> ModelSemanticRelation -> SemanticDataflowInput -> SemanticDataflowJudgment -> Manifest`

Route model binding remains independent:

`RouteDefinition -> RouteBindingInterface`

## Interfaces

- `SchemaRelationInterface`: table-local foreign-key evidence.
- `SchemaRelationIndexInterface`: canonical lookup over cumulative schema foreign-key evidence.
- `ModelRelationInterface`: Eloquent relation evidence plus reconciled semantic relation surface.
- `RouteBindingInterface`: route parameter/model-binding evidence; it does not infer bindings from schema relations.
- `SemanticRelationReconciliationInterface`: explicit judgment/status for combining Eloquent and schema evidence.

## Ownership

`SchemaInterface` owns migration-derived schema semantics. `SchemaRelationIndexInterface` only indexes that evidence. `ModelRelationInterface` owns model relation semantics. `RouteBindingInterface` owns Laravel route binding semantics. `SemanticRelationReconciliationInterface` composes evidence; it does not own dataflow closure.

## Dataflow

The existing `SemanticDataflowJudgment` remains the sole closure/fixed-point authority. Manifest remains a seed projection only.

## Phase 974 correction

`modelSemanticDefinition.ts` now constructs one `SchemaRelationIndexInterface` per model semantic build and passes it through both `ModelSemanticRelation` construction and `ModelSemanticSurface.properties`. This prevents a second relation construction path from silently losing schema reconciliation context.
