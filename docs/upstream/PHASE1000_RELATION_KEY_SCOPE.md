# Phase 1000 — RelationKey semantic scope

Phase 1000 closes a semantic false-positive in the relation boundary.

## Problem

`RelationKey` previously had only `convention` and `explicit`. That vocabulary was reused for every Eloquent relation family, so unsupported families such as `belongsToMany`, through relations, and polymorphic relations could carry `convention` even though no direct foreign-key interpretation had been performed.

That made an absence of direct-FK analysis look like positive convention evidence.

## Canonical rule

Direct foreign-key families:

- `belongsTo`
- `hasOne`
- `hasMany`

may carry:

- `RelationKey.convention`
- `RelationKey.explicit`

Non-direct families carry:

- `RelationKey.not_applicable`

until their own semantic key vocabulary is implemented.

## Flow

```text
Eloquent relation descriptor
  -> direct relation producer
  -> RelationKey
       convention | explicit | not_applicable
  -> schema reconciliation
  -> canonical ModelSemanticRelation identity
  -> graph projection
```

`not_applicable` is not a conflict and is not an inference. It means that direct-FK reconciliation is outside the relation family's semantic domain.

## Laravel alignment

Laravel's `belongsToMany` has pivot-specific keys (`foreignPivotKey`, `relatedPivotKey`, `parentKey`, `relatedKey`) and therefore cannot be represented faithfully by the direct `(foreign, local)` `RelationKey`. Through and polymorphic relations likewise have different key semantics.

## Dataflow boundary

No migration/model relation is converted into a new dataflow solver or interface. Structural schema lineage and runtime/value dataflow remain separate authorities.

```text
MigrationInterface
 -> SchemaInterface
 -> SchemaRelation
 -> ModelSemanticRelation
 -> GraphSemanticRelation
 -> ServiceGraph

SemanticDataflowInput
 -> SemanticDataflowJudgment
 -> SemanticDataflowInterface
 -> SemanticDataflowIRProjection
```

## Legacy policy

`packages/core/src/compiler/scanner/subscanners/model/migrationScanner.ts` remains physically present and empty.
