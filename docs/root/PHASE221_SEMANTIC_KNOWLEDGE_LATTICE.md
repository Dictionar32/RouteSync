# Phase 221 — Semantic Knowledge Lattice & Fixed-Point Data-Flow

## Goal

Raise RouteSync's analysis layer beyond syntax traversal by introducing a monotone
semantic lattice and fixed-point worklist over canonical `SemanticDataFlowFact` values.

## External research

- MLIR DataFlow uses lattice elements, monotone joins, analysis state, dependencies,
  and a solver that iterates until a fixed point.
- LLVM Attributor performs interprocedural abstract attribute deduction through
  fixpoint iteration.
- CodeQL separates language-specific flow modeling from a generic global data-flow
  solver and models argument/parameter, return, and field flow.
- WALA and SootUp provide reusable interprocedural data-flow frameworks.
- SVF combines language-independent IR with sparse value-flow, field sensitivity,
  context sensitivity, and demand-driven refinement.

RouteSync adopts the analysis principles, not their IR/CFG ontology.

## Canonical boundary

```text
semantic facts
    ↓
SemanticDataFlowFact(value-flow)
    ↓
SemanticKnowledgeLattice
    ↓
monotone join
    ↓
fixed-point propagation
    ↓
derived analysis states
```

The lattice contains:

- `uninitialized` — no analysis information yet.
- `known` — a conservative set of semantic knowledge identities.
- `top` — completely unknown/overdefined information.

`Map`/`Set` are implementation indexes only.

## What this does not claim

The solver does not infer execution order, dominance, path feasibility, dynamic dispatch
certainty, or nearest reaching definitions. Those require additional evidence and can
be layered on top of this fixed-point substrate.
