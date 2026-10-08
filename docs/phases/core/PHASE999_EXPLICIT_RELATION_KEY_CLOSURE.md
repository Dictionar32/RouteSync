# Phase 999 — Explicit Eloquent relation-key closure

Phase 999 closes a concrete upstream gap: the Eloquent relation producer previously emitted `RelationKey = convention` for every relation, even when Laravel source supplied explicit foreign/local keys.

## Canonical path

```text
PHP relation invocation
  -> Eloquent relation descriptor
  -> EloquentRelationAst
  -> RelationKey (convention or explicit)
  -> SchemaRelationIndexInterface
  -> SemanticRelationReconciliationInterface
  -> canonical ModelSemanticRelation identity
  -> GraphSemanticRelation
  -> GraphEdgeRelationSink
  -> ServiceGraph.edgeRelations
```

For direct foreign-key relations:

- `belongsTo($related, $foreignKey, $ownerKey)` reads positions 1/2 as `foreignKey`/`ownerKey`.
- `hasOne($related, $foreignKey, $localKey)` reads positions 1/2 as `foreignKey`/`localKey`.
- `hasMany($related, $foreignKey, $localKey)` reads positions 1/2 as `foreignKey`/`localKey`.

Only literal string arguments become explicit semantic keys. Missing or non-literal key expressions remain convention evidence rather than being guessed.

Non-direct relation families (`belongsToMany`, through, polymorphic) remain outside direct-FK reconciliation and retain `not_applicable` until their own semantic key vocabulary is modeled.

## Identity consequence

Once schema reconciliation finds exactly one matching FK, the semantic relation identity is rebuilt from the canonical explicit `(foreign, local)` key. This makes convention and explicit source spellings converge on the same semantic identity.

## Dataflow boundary

No migration/dataflow interface or second solver is introduced. Structural migration/schema/model/graph lineage remains separate from:

```text
SemanticDataflowInput
 -> SemanticDataflowJudgment
 -> SemanticDataflowInterface
 -> SemanticDataflowIRProjection
```

The IR remains a projection of the authoritative least-fixed-point judgment.

## Validation

- `audit-phase999-explicit-relation-key.cjs`: clean
- changed TypeScript files: transpile-ok
- legacy `migrationScanner.ts`: physically retained and 0 bytes
- full `tsc`/Vitest: not claimed green because workspace type definitions for `node` and `vitest/globals` are unavailable
