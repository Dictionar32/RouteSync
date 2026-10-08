# Phase 997 — Relation Reconciliation Scope

Phase 997 closes a semantic classification gap in the upstream reconciliation boundary.

## Problem

The Laravel relation vocabulary contains direct foreign-key relations (`belongs_to`, `has_many`, `has_one`) as well as relation families whose semantics are not reducible to one direct schema foreign key (`belongs_to_many`, `has_one_through`, `has_many_through`, `morph_to`, `morph_one`, `morph_many`, `morph_to_many`, `morphed_by_many`).

Previously an explicit key on an unsupported family could be classified as `conflict` merely because no direct-FK candidate was found. That is incorrect: absence of a direct-FK reconciliation is not evidence of a schema conflict.

## Fix

`RelationReconciliationStatus` now includes `not_applicable`. The reconciler first determines whether the relation belongs to the direct-FK family. Unsupported families are retained as semantic Eloquent relations with their original key and are not falsely reported as schema conflicts.

The direct-FK family remains exactly:

- `belongs_to`
- `has_many`
- `has_one`

Only this family may produce `matched`, `ambiguous`, `conflict`, or `eloquent_only` from the current schema FK index.

## Boundary

This does not add a new solver or dataflow interface. Many-to-many, through, and polymorphic relations remain upstream semantic relations until their dedicated schema semantics are modeled.

The structural lane remains:

`MigrationInterface -> SchemaInterface -> SchemaRelationIndexInterface -> ModelSemanticRelation -> GraphSemanticRelation -> GraphEdgeRelationSink -> ServiceGraph`

The dataflow lane remains independent:

`SemanticDataflowInput -> SemanticDataflowJudgment -> SemanticDataflowInterface -> SemanticDataflowIRProjection`

## Laravel alignment

Laravel exposes `hasMany`, `hasOne`, and `belongsTo` as direct relationship APIs while also exposing `belongsToMany`, through relationships, and polymorphic relationships with different key structures. The RouteSync reconciler therefore must not collapse all of them into the direct foreign-key model.

## Validation

Phase 997 audit verifies the new status, direct-family guards, the existing ecommerce relation families, and the presence of non-direct relation vocabulary. The legacy migration scanner remains physically present and empty.
