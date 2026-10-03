# Phase 291 — Relational Execution Engine Boundary

Phase 291 raises the construct-free requirement into the generic semantic execution substrate.

## Execution authority

```text
PHP syntax
  -> syntax/evidence boundary
  -> neutral evidence
  -> typed semantic relations
  -> declarative semantic program
       schemas + constraints + rewrites
  -> generic relation execution
       indexed joins + delta agenda + stratified closure
  -> rewrite normalization
  -> proof-carrying closure
```

The parser semantic adapter, relation solver, constraint calculus, and rewrite engine contain no source-control dispatch keywords. Source grammar remains isolated in syntax infrastructure.

## Solver model

The relation solver uses:

- indexed relation buckets;
- delta/agenda evaluation;
- semi-naive-style anchored matching;
- stratified negative premises;
- recursive fixed-point saturation;
- derivation provenance.

This follows the useful execution ideas found in Datafrog and Differential Dataflow while keeping RouteSync's semantic authority declarative. Datafrog models static relations and monotonically increasing variables; Differential Dataflow incrementally maintains computations as inputs change. Eqlog adds equality/congruence closure to Datalog, while egglog combines Datalog with equality saturation and lattice reasoning.

## Boundary invariant

The following are not semantic entities:

```text
if
for
while
switch
choice
branch
loop
repetition
```

They may exist only at the concrete syntax/evidence boundary where the source language must be recognized.

The executable Phase 291 test guards the semantic adapter and generic semantic execution files against reintroduction of the concrete control vocabulary.
