# Phase 294 — Typed Relational Execution Substrate

The semantic authority now has an explicit relational execution layer rather than treating host collections as its execution model.

## New substrate

- `semanticRelationalAlgebra.ts`
  - `Relation`
  - `Delta`
  - `union`
  - `join`
  - `antiJoin`
  - `projectRelation`
  - `selectRelation`
  - `expandRelation`
  - `fixedPoint`
- `semanticRelationStore.ts`
  - typed relation buckets
  - arity indexing
  - canonical tuple identity
  - incremental fact insertion

## Solver boundary

`semanticRelationSolver.ts` now uses `SemanticRelationStore` as its fact index. Relation matching therefore has an explicit relational storage abstraction instead of a raw collection index owned by the solver.

## Authority invariant

The following production semantic files contain no lexical occurrence of:

- `if`
- `for`
- `while`
- `switch`
- `map`
- `filter`
- `reduce`
- `flatMap`

The canonical legacy semantic-control vocabulary is also absent.

The syntax/evidence boundary remains responsible for recognizing source-language grammar. The semantic authority receives typed evidence and operates only over relations, constraints, deltas, fixed points and rewrites.

## Research basis

Eqlog combines Datalog with equality/congruence closure, indexed relation tables and semi-naive fixed-point evaluation. egglog combines Datalog and equality saturation with incremental execution and lattice reasoning. Ascent adds lattice-valued fixed points, while Differential Dataflow demonstrates reusable incremental results across iterative computation.
