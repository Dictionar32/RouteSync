# Phase 180 — Semantic Meaning, Not Statement Ontology

## Architectural change

The canonical semantic model no longer uses parser-shaped statement categories as ontology:

- `decision` removed
- `selection` removed
- `iteration` removed

They are replaced by semantic concepts:

- `choice` — represents alternative outcomes driven by a predicate and/or subject.
- `repetition` — represents a repeated semantic region described by initialization, condition,
  update, iterable, binding, and body knowledge.

The source syntax (`if`, `switch`, `match`, `while`, `for`, `foreach`, ternary, etc.) is evidence
used by the producer to construct these concepts. It is not retained as the semantic identity of
the knowledge.

## Why

Tree-sitter intentionally exposes a concrete syntax tree whose nodes correspond to grammar
symbols. That makes it suitable as syntax evidence, but not as the ontology of RouteSync's
semantic model.

RouteSync therefore raises the information into typed semantic data:

```text
syntax evidence
  -> semantic meaning
  -> typed knowledge
  -> typed data-flow
  -> derived graph/index
```

Data-flow roles (`predicate`, `subject`, `condition`, `iterable`, `binding`, `body`, etc.) explain
semantic participation without becoming control-flow edges.

## Control-flow boundary

No canonical `successor`, `predecessor`, `branch_to`, `reenters`, `executes`, or similar CFG relation
is introduced. `choice` and `repetition` describe semantic structure and data dependencies; an
interpreter may derive execution behavior later.

This follows the useful distinction in graph-oriented IR design: values/data dependencies can be
represented independently from control-flow regions. MLIR explicitly distinguishes graph regions
from SSACFG regions and treats graph relationships as semantic data rather than implicit execution
order.

## Data-model invariants

1. `facts` are canonical semantic knowledge.
2. `dataFlow` is canonical typed dependency/value-flow knowledge.
3. `relations` is only a derived compatibility projection.
4. `Map`/`Set` are derived lookup/validation structures only.
5. Parser construct names are not canonical fact kinds.
6. Domain absence remains explicit `SemanticPresence` data.
