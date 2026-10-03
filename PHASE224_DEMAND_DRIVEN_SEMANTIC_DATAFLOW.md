# Phase 224 — Demand-Driven Semantic Data-Flow

RouteSync now has a bounded demand-driven query over canonical semantic data-flow facts.

## Why

Phase 223 added bounded context sensitivity. The next refinement is not another syntax representation, but the ability to ask a focused value-flow question without materializing the entire reachable graph.

This follows the direction of demand-driven value-flow analysis used by static-analysis systems such as SVF/SUPA while keeping RouteSync's semantic model independent from AST/CFG/ICFG structures.

## Model

```text
canonical SemanticDataFlowFact
             |
             v
       demand query
       /          \
   forward       backward
      |              |
      +-------> witness path
```

The query may specify a source, target, or both. Results are bounded by a step budget and explicitly report `budgetExceeded`; the analyzer never upgrades a missing path into a semantic fact.

## Boundary

- `SemanticKnowledgeDataFlow` remains the source of truth.
- `Map`/`Set` are derived indexes and traversal state only.
- Tree-sitter, AST, CFG, and call graphs are not semantic identities in this analysis.
- Context sensitivity, ordering, aliasing, and dynamic dispatch remain separate refinements.
- A demand result is analysis evidence, not a new canonical semantic fact.
