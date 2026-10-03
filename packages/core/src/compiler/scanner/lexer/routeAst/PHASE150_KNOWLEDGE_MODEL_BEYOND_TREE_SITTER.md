# Phase 150 — Knowledge Model Beyond Tree-sitter

## Boundary

Tree-sitter remains the syntax substrate. Its nodes, fields, queries and
node-types describe concrete syntax. RouteSync does not use those forms as
its semantic model.

## Elevated model

Source control-flow-shaped constructs are projected into a higher-level
knowledge model:

- `KnowledgeFact` — a fact/value with a stable key.
- `KnowledgeState` — a state value in the data flow.
- `KnowledgeAlternative` — a relation between a condition fact and an outcome
  fact.
- `KnowledgeChoice` — a set of alternatives plus optional default outcome.
- `KnowledgeIteration` — state, termination fact, transitions and continuation.
- `KnowledgeTransition` — an explicit state-to-state relation.
- `KnowledgeFlow` — the union consumed by downstream interpreters.

The model intentionally does not use `if`, `while`, or `switch` as its
vocabulary. Those are source representations that can be translated into the
model, not the model itself.

## Runtime rule

Runtime loops/branches are interpreters only. They must not contain Laravel
knowledge, delimiter meaning, route semantics, or syntax classification.
Those meanings must arrive as facts, relations, states and transitions.

## Data-flow direction

`source syntax -> syntax fact -> knowledge model -> semantic fact -> consumer`

This is deliberately one level above the Tree-sitter CST. Tree-sitter's
structured nodes/fields/queries are evidence used to construct facts; they are
not the final abstraction boundary.
