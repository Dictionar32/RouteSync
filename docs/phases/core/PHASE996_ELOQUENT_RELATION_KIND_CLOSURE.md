# Phase 996 — Eloquent Relation Kind Closure

Phase 996 closes a semantic ADT mismatch at the upstream reconciliation boundary.

## Defect

`EloquentRelationAst.relation` is the closed `RelationKind` algebra:

- `{ kind: 'belongs_to' }`
- `{ kind: 'has_many' }`
- `{ kind: 'has_one' }`
- and the remaining Laravel relation kinds.

The reconciliation implementation was incorrectly comparing this field to raw strings. That bypassed the intended closed discriminant and could make the schema/Eloquent reconciliation frontier reject or mis-handle supported relation kinds.

## Repair

`semanticReconciliation.ts` now branches through `relation.relation.kind`.

The executable identity test covers:

- `belongsTo`
- `hasMany`
- `hasOne`
- convention foreign keys
- explicit foreign keys
- canonicalization to the same `(foreign, local)` identity.

## Boundary

The structural lane remains:

`MigrationInterface -> SchemaInterface -> SchemaRelationIndexInterface -> ModelSemanticRelation -> GraphSemanticRelation -> GraphEdgeRelationSink -> ServiceGraph`

The runtime/value lane remains:

`SemanticDataflowInput -> SemanticDataflowJudgment -> SemanticDataflowInterface -> SemanticDataflowIRProjection`

No migration-to-dataflow interface or second dataflow solver is introduced.

## Laravel correspondence

Laravel's documented relationship conventions support `belongsTo`, `hasMany`, and `hasOne`, while migration foreign-key helpers can encode the same relationship using convention-based or explicit constraints. RouteSync therefore canonicalizes the schema relationship once at the upstream reconciliation boundary rather than re-inferring it downstream.

## Legacy policy

`packages/core/src/compiler/scanner/subscanners/model/migrationScanner.ts` remains physically present and empty when inactive. It is not deleted.
