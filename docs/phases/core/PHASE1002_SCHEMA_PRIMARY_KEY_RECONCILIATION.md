# Phase 1002 — Schema Primary-Key Evidence for Relation Reconciliation

Phase 1002 closes a semantic overclaim in direct Eloquent relation reconciliation.

## Problem

A partial Laravel relation such as `belongsTo(Account::class, 'account_uuid')` specifies the foreign key but leaves the owner key implicit. The reconciler previously allowed any foreign key to the target model when the local key was omitted. That could incorrectly canonicalize a relation to a non-primary referenced column.

Laravel's default owner/local key is the related/source model primary key, not an unconditional `id`. Therefore the missing key must be completed from schema primary-key evidence, not guessed.

## Canonical rule

For direct relations:

- `belongsTo`: when local/owner key is omitted, the schema FK must reference a primary column of the target table.
- `hasOne` / `hasMany`: when local key is omitted, the schema FK must reference a primary column of the source table.
- `explicit_foreign`: schema evidence completes the local key only when exactly one FK matches the requested foreign column and the referenced column is primary.
- `explicit`: both keys remain source-declared and must match the schema FK exactly.
- `convention`: convention determines the foreign-column candidate, but the referenced column still requires primary-key evidence.
- no primary-key evidence means no match; RouteSync does not invent `id`.

## Boundary

The schema remains structural evidence:

`MigrationInterface → SchemaInterface → SchemaRelationIndexInterface`

Model relation semantics consume that evidence through the existing single `reconcileSemanticRelation` authority.

No new migration/dataflow interface or solver is introduced.

## Dataflow boundary

Runtime/value flow remains:

`SemanticDataflowInput → SemanticDataflowJudgment → SemanticDataflowInterface → SemanticDataflowIRProjection`

Migration/schema/model-relation lineage is not converted into runtime dataflow seeds.

## Graph boundary

`ModelSemanticRelation → GraphSemanticRelation → GraphEdgeRelationSink → ServiceGraph.edgeRelations`

Graph projection does not perform schema inference.

## Validation

Phase 1002 adds executable tests for:

1. partial `belongsTo` foreign key canonicalizing to a non-`id` primary key (`uuid`);
2. convention relation refusing a foreign key that references a non-primary target column;
3. existing ecommerce direct-FK identity/provenance behavior remaining intact.

The legacy `migrationScanner.ts` remains physically present and empty.
