# Phase 1003 — Model Primary-Key Reconciliation

Phase 1002 made direct relation reconciliation depend on schema primary-key evidence. Phase 1003 closes the remaining upstream gap: the model's own primary-key semantic must also be checked against the cumulative schema.

## Judgment

`ModelSemanticDefinition.identity.primaryKey` now carries `primaryKeyReconciliation` produced by the single upstream helper `reconcileModelPrimaryKey()`.

Statuses:

- `matched`: exactly one schema primary key and it equals the model key.
- `conflict`: exactly one schema primary key exists but differs from the model key.
- `unresolved`: the table has no primary-key evidence (or the table is absent).
- `ambiguous`: the schema declares multiple primary columns while the Eloquent model exposes one primary-key slot.

This preserves Laravel's conventional `id` behavior as semantic evidence rather than silently replacing it with whatever schema happens to declare.

## Boundary

Structural lineage remains:

`MigrationInterface → SchemaInterface → SchemaRelationIndexInterface / ModelPrimaryKeyReconciliationInterface → ModelSemanticDefinition → ModelSemanticRelation → GraphSemanticRelation`

Runtime/value dataflow remains independent:

`SemanticDataflowInput → SemanticDataflowJudgment → SemanticDataflowInterface → SemanticDataflowIRProjection`

There is deliberately no `MigrationDataflowInterface`, no migration-to-dataflow seed, and no second solver.

## Why this matches external architecture

Laravel documents explicit foreign-key references and convention-based constraints, and supports UUID/ULID primary-key types. The semantic model therefore must preserve the distinction between model key semantics and schema evidence instead of hardcoding `id`. CodeQL similarly separates semantic dataflow nodes from AST nodes and centralizes global flow solving; MLIR uses narrow interfaces to decouple generic analyses from concrete IR operations.

## Next frontier

After key parity is closed, the safe next upstream expansion is relation-family-specific identity:

- `belongsToMany → PivotRelationIdentity`
- `hasOneThrough` / `hasManyThrough → ThroughRelationIdentity`
- `morph* → PolymorphicRelationIdentity`

Those must not be forced into the existing direct `RelationKey` algebra.
