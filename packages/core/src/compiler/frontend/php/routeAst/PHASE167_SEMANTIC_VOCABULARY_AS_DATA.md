# Phase 167 — Semantic Vocabulary as Data

## Goal

The semantic model is the source of truth. Syntax constructs (`if`, `while`, `switch`, `===`, `!==`, `for`, `foreach`, `try`, `catch`, `match`) are evidence used by a producer; they are not the ontology of the model.

## Elevation

Semantic vocabulary is represented as immutable typed descriptors:

- operator definitions
- iteration definitions
- transition definitions
- data-flow relation definitions
- decision/selection outcomes

A `Map` is only a derived index over these definitions.

## Data-flow invariant

Every semantic edge connects two real `KnowledgeId` facts. Statement order and syntax-node order are never edges.

Decision and selection branches are represented as `outcome` facts. Exception handling is represented as an `exception` fact with `catches` and `executes_finally` relations.

## Boundary

```text
syntax evidence
    -> typed semantic facts
    -> semantic vocabulary
    -> data-flow relations
    -> consumers
```

Tree-sitter remains a syntax parser/CST provider, not the semantic source of truth.
