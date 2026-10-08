# Phase 178 — Canonical Data-Flow Facts

The semantic knowledge model now treats data-flow itself as typed data rather than making the graph edge representation the canonical source of truth.

## Canonical

- `SemanticFact[]` — semantic knowledge.
- `SemanticDataFlowFact[]` — typed data-flow knowledge:
  - `dependency`
  - `value-flow`

## Derived

`SemanticDataFlowEdge` / `relations` is retained only as a compatibility graph projection. It is reconstructed from canonical `dataFlow` facts and is validated against them.

This keeps the architecture aligned with the rule:

> Knowledge becomes data; data-flow becomes typed data; graph/index structures are derived.

Tree-sitter remains syntax evidence only. It does not define the semantic identity or ontology of RouteSync.
