# Phase 977 — Upstream Relation Identity Preservation

## Boundary

The canonical `ModelRelationInterface` is now retained on `ModelSemanticDefinition` as `relation`. Downstream model canonicalization consumes `model.relation.semantic` directly instead of reconstructing semantic relations from the property surface.

```text
MigrationAst
  -> SchemaInterface
  -> SchemaRelationIndexInterface
  -> EloquentRelationAst
  -> ModelRelationInterface
  -> SemanticRelationReconciliationInterface
  -> ModelSemanticDefinition.relation
  -> CompleteLaravelSourceModel
  -> graph/dataflow projections
  -> manifest
```

`ModelSemanticDefinition.surface` remains a property projection. It is not the authority for relation evidence or reconciliation.

## Laravel fixture evidence

The ecommerce fixture contains conventional and explicit foreign-key forms, including `foreignId(...)->constrained()`, `constrained('table')`, and `foreign(...)->references(...)->on(...)`. Eloquent fixtures include `belongsTo`, `hasOne`, and `hasMany` relations whose schema evidence can be reconciled upstream.

## Dataflow/manifest ownership

`semanticDataflowInputsFromSourceModel()` remains the single manifest seed assembly surface. It does not solve closure, derive reaches, or construct a second solver. The canonical semantic dataflow judgment remains the closure authority.

## Legacy-file policy

Unreferenced legacy scanner files remain physically present and are emptied rather than deleted.
