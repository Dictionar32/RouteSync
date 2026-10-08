# Phase 1009 — Upstream Relation Identity Alignment

Phase 1009 closes the remaining positional-alignment leak in `ModelRelationInterface`.

## Change

`modelRelationInterfaceFrom()` no longer reconciles `evidence[index]` with `semantic[index]`.
It now selects the semantic relation by stable semantic identity components:

- source model
- relation property/name
- relation name
- target model
- Eloquent relation type

The alignment is accepted only when exactly one semantic relation matches. Zero or multiple matches are an upstream identity-alignment failure, rather than silently pairing unrelated relations by array position.

## Boundary decisions

Migration remains schema evidence. It is not converted into a dataflow interface.

```text
MigrationInterface
  -> SchemaInterface
  -> SchemaRelationInterface
  -> SemanticRelationReconciliationInterface
  -> ModelSemanticRelation
```

Runtime/value flow remains exclusively owned by `SemanticDataflowJudgment` and `SemanticDataflowInterface`:

```text
SemanticDataflowInput (seed facts only)
  -> SemanticDataflowJudgment (least fixed point)
  -> SemanticDataflowInterface
  -> SemanticDataflowIRProjection
```

No `MigrationDataflowInterface`, `ModelRelationDataflowSolver`, `GraphDataflowSolver`, or second dataflow authority is introduced.

## External alignment

Laravel migrations are schema/foreign-key evidence; `constrained()` may derive the referenced table/column by convention. CodeQL separates semantic dataflow graph nodes from AST nodes and uses a generic dataflow solver/configuration boundary. MLIR uses interfaces to decouple generic analyses from concrete implementations. RouteSync therefore keeps migration/schema relations, model relation reconciliation, graph projection, and runtime dataflow as separate semantic contracts.
