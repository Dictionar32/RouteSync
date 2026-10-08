# Phase 236 — Declarative Relation Solver with Agenda, Derivation, and Fixed-Point Saturation

## Goal

Move semantic control reasoning away from source-language `if`/`for`/`while`/`switch` and into a syntax-neutral relation program executed by a generic solver/rewrite engine.

## Research basis

- MLIR PDLL: declarative match/rewrite patterns.
- MLIR PDL/DRR: patterns represented as data and applied by generic rewrite infrastructure.
- LLVM MemorySSA: versioned state with use/def/phi relations and walker-based queries.
- CodeQL data-flow: semantic value-flow graph is distinct from AST syntax.

## Implementation

`semanticRelationSolver.ts` now provides:

- relation tuple model
- declarative pattern/rewrite model
- relation-arity indexing
- agenda/worklist fixed-point evaluation
- delta/anchor matching so a rewrite is reconsidered when new facts arrive
- duplicate derivation suppression
- derivation provenance (`ruleId`, premises, bindings)
- detailed solver result with saturation state and round count

The solver implementation is mechanics only. Domain meaning remains in semantic relation catalogs such as `semanticControlRelationCatalog.ts`.

## Control semantics

```text
choice + predicate + alternative
        -> guard
        -> merge

iteration + successor
        -> fixed_point
        -> backedge
```

The control relation layer does not inspect PHP `if`, `switch`, `while`, or `for` syntax. Those constructs may exist at evidence-decoding boundaries, but they are not semantic authority.

## Validation

- relation solver runtime test: PASS
- semantic control relation data-flow regression: PASS
- focused TypeScript compilation: PASS
