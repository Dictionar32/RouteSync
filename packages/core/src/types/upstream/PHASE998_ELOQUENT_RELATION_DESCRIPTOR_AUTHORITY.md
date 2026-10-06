# Phase 998 — Eloquent Relation Descriptor Authority

`EloquentRelationAst` previously carried three semantically coupled representations: `descriptor`, `relation`, and `eloquentType`. Although the canonical producer populated them consistently, the type allowed a producer to construct inconsistent values.

Phase 998 makes `EloquentRelationDescriptor` the authority at the evidence boundary. `eloquentRelationAstFromDescriptor()` constructs the closed relation evidence and derives `relation` and `eloquentType` from the descriptor.

## Boundary

```text
Laravel relation method
  -> EloquentRelationDescriptor
  -> EloquentRelationAst
  -> SchemaRelationIndexInterface
  -> SemanticRelationReconciliationInterface
  -> ModelSemanticRelation
  -> GraphSemanticRelation
```

No migration-to-dataflow interface or second dataflow solver is introduced.

The dataflow lane remains:

```text
SemanticDataflowInput
  -> SemanticDataflowJudgment
  -> SemanticDataflowInterface
  -> SemanticDataflowIRProjection
```

The legacy `migrationScanner.ts` file remains physically present and empty.
