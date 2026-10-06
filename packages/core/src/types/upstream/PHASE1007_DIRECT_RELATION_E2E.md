# Phase 1007 — direct relation-family E2E closure

This phase closes the executable proof for Laravel direct foreign-key relation families.

## Canonical path

```text
Laravel migration
  -> MigrationInterface
  -> SchemaInterface / SchemaRelationIndexInterface
  -> EloquentRelationAst
  -> ModelRelationInterface
  -> SemanticRelationReconciliationInterface
  -> ModelSemanticRelation
  -> SourceModelReferenceIndex / manifest relation
  -> GraphSemanticRelation
  -> GraphEdgeRelationSink
```

The ecommerce fixture proves all three direct-FK families that RouteSync currently reconciles:

- `OrderDetail::order()` — `belongsTo(Order::class)`
- `Order::details()` — `hasMany(OrderDetail::class)`
- `Order::payment()` — `hasOne(Payment::class)`

The first and third also exercise explicit schema evidence in different forms: `foreignId(...)->constrained()` and `foreign(...)->references(...)->on(...)`.

## Boundary rule

`RelationKey` remains a direct-FK vocabulary only. `belongsToMany`, through relations, and polymorphic relations remain `not_applicable`; they must receive their own semantic identities before becoming canonical graph relations.

No migration-to-dataflow interface is introduced. Schema/migration evidence is structural lineage; `SemanticDataflowInterface` remains the sole runtime/value dataflow authority, and IR only projects that authority.

## Why no target-model relation interface

A second target-model primary-key interface would duplicate `ModelPrimaryKeyReconciliationInterface`. The model already owns its primary-key judgment. Relation reconciliation consumes schema FK/PK evidence; catalog-wide model-key parity remains a later cross-model validation step, not a second relation authority.
