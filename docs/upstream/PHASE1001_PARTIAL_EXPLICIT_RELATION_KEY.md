# Phase 1001 — Partial explicit Eloquent relation key

Phase 1001 closes an overclaim in the direct Laravel relation boundary. Laravel permits an explicit foreign key while the owner/local key remains implicit. The producer previously filled the missing local key with `id`, which is not semantically safe because Laravel defaults to the model primary key and a model may configure a different primary key.

## Canonical vocabulary

`RelationKey` now distinguishes:

- `convention` — neither direct key is explicitly supplied by the source.
- `explicit_foreign` — the source explicitly supplied the foreign key but left owner/local key implicit.
- `explicit` — both foreign and owner/local keys are explicitly supplied, or reconciliation has canonicalized the relation against schema evidence.
- `not_applicable` — the relation family is not a direct-FK relation.

The producer never invents `id`. A partial explicit relation can be reconciled against schema evidence by matching the explicit foreign column and referenced model; when exactly one FK matches, the canonical result becomes an explicit foreign/local pair using the schema's referenced column.

## Boundary

```text
Laravel relation source
  -> EloquentRelationAst
  -> RelationKey
  -> SchemaRelationIndexInterface
  -> SemanticRelationReconciliationInterface
  -> ModelSemanticRelationIdentity
  -> GraphSemanticRelation
```

No migration-to-dataflow interface or second dataflow solver is introduced. Runtime/value dataflow remains owned by the existing `SemanticDataflowJudgment` and projected to IR.
