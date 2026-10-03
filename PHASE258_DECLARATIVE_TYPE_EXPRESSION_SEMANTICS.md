# Phase 258 — Declarative TypeExpression Semantic Projection

## Goal

Continue the semantic-control architecture beyond the control-flow ontology by removing procedural `switch` dispatch from the TypeExpression semantic boundary.

## Change

`typeExpressionSemanticType.ts` no longer classifies `TypeExpression.kind` with a `switch`.

Semantic classification is now represented as declarative relations:

```text
 type_expression_kind(kind)
        |
        v
 type_expression_projection(kind, projection)
        |
        v
 typed constructor handler
```

Primitive classification follows the same model:

```text
 primitive_kind(kind)
        |
        v
 primitive_projection(kind, projection)
```

The existing generic relation solver performs matching and fixed-point execution. The constructor registry is only a derived execution dispatch after the semantic relation has selected the operation.

## Boundary rule

The solver's `while`/iteration and indexing structures remain execution mechanics. They are not semantic facts. Semantic meaning is carried by relations and rewrite rules.

Likewise, the linked-list `Sequence` traversal remains data-structure traversal rather than semantic classification.

## Validation

- Targeted TypeScript validation of the changed modules: PASS.
- Runtime relation program test covering all TypeExpression kinds: PASS.
- Runtime primitive relation test covering all primitive kinds: PASS.
- No `switch` remains in `typeExpressionSemanticType.ts` or `typeExpressionSemanticRelations.ts`.
