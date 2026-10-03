# Phase 238 — Semi-Naive Declarative Relation Engine

## Goal

Push RouteSync further beyond syntax-driven control flow by making the semantic relation solver an actual delta/worklist engine. Semantic meaning remains in declarative relations and rewrite rules; loops in the implementation are solver mechanics only.

## Research basis

- MLIR PDLL separates pattern matching from rewrite semantics.
- MLIR Pattern Rewriter uses pattern sets, a worklist, benefits/priorities, and repeated application until a fixed point.
- Souffle/Datalog describes facts as relation tuples and rules as Horn-style relational derivations. Semi-naive evaluation derives only tuples depending on the previous delta.
- LLVM MemorySSA models semantic state with versioned MemoryDef/MemoryUse/MemoryPhi relations rather than source syntax.

## Changes

`semanticRelationSolver.ts` now maintains:

1. an incremental fact index;
2. a rule dependency index keyed by relation/arity;
3. a delta agenda;
4. applicable-rule selection from the current delta;
5. fixed-point saturation over newly derived facts;
6. derivation provenance for every produced fact.

The solver no longer rebuilds the complete fact index on every round and does not scan every rule when the delta cannot satisfy any of its premises.

## Semantic control-flow boundary

Source constructs remain evidence at the parser boundary only.

```text
if / switch / while / for
        ↓
typed semantic facts
        ↓
choice / predicate / alternative / iteration / successor
        ↓
declarative rewrite rules
        ↓
semi-naive relation solver
        ↓
guard / merge / fixed_point / backedge
```

The semantic consumer does not need to inspect `if`, `switch`, `while`, or `for` to determine meaning.

## Validation

- focused strict TypeScript compile: PASS
- Phase 234 control relation regression: PASS
- Phase 235 semantic control relation data-flow regression: PASS
- Phase 236 relation solver regression: PASS
