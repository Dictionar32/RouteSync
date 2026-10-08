# Phase 292 — Relational Execution Engine

The semantic adapter and generic relational execution substrate now avoid both source-control dispatch and the host collection combinators `map`, `filter`, `reduce`, and `flatMap`.

## Boundary

```text
PHP syntax
  -> syntax/evidence boundary
  -> neutral evidence
  -> typed semantic relations
  -> declarative program
       schemas + constraints + rewrites
  -> recursive relational collection algebra
  -> indexed relation solver
  -> fixed-point closure
  -> rewrite normalization
  -> proof-carrying artifact
```

## Execution substrate

`semanticRelationalCollections.ts` provides named recursive relational operations. The semantic solver, constraint calculus, rewrite engine, and PHP semantic adapter consume those operations instead of directly depending on host collection combinators.

This is an execution concern, not a new semantic ontology: relation schemas, constraints, and rewrite rules remain the source of semantic meaning.

## Research basis

Datafrog separates static relations from monotonically growing variables and uses relation joins for recursive evaluation. Differential Dataflow demonstrates incremental relational computation. egglog combines Datalog with equality saturation and relational e-matching. These systems motivate the separation of semantic relations from execution machinery.
