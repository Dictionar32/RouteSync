# Phase 235 — Semantic Control Relation Data-Flow

## Goal

Move control semantics one layer further away from PHP syntax. `if`, `switch`, `while`, `for`, and `foreach` are evidence at the adapter boundary; the canonical semantic model is projected into syntax-neutral relations and saturated by the declarative relation solver.

## Research basis

- MLIR PDLL separates pattern matching from rewriting and treats the rewrite program as declarative pattern data.
- Soufflé models analysis as relations/facts/rules and lets the engine compute derived relations.
- LLVM MemorySSA represents state through versioned memory accesses, def-use relations, and merge points rather than making source syntax the semantic state.
- CodeQL's data-flow graph explicitly differs from the AST: semantic value-carrying nodes matter, while constructs such as `if` need not be data-flow nodes.

## Architecture

```text
PHP parser / lexer evidence
        |
        v
SemanticChoice / SemanticRepetition
        |
        v
semanticControlRelationDataFlow
        |
        v
relation tuples (facts)
        |
        v
semanticControlRelationCatalog
        |
        v
semanticRelationSolver
        |
        v
fixed-point control knowledge
  - guard
  - merge
  - fixed_point
  - backedge
```

## Important boundary

The PHP adapter may still use a `switch` to decode the discriminated union of parser evidence. That is evidence decoding, not semantic control logic. The semantic consumer does not inspect `if_statement`, `while_statement`, `for_statement`, or `switch_statement` to decide meaning.

## New canonical projection

`SemanticKnowledgeDataFlow.controlRelations` is derived from canonical semantic facts. It contains relation tuples such as:

```text
choice(choiceId, conditional)
predicate(choiceId, predicateId)
alternative(choiceId, thenId, satisfied, stop)
alternative(choiceId, elseId, unsatisfied, stop)

iteration(loopId, condition, bodyId)
successor(loopId, bodyId, loopId)
```

The declarative rewrite program derives:

```text
guard(thenId, predicateId, satisfied)
guard(elseId, predicateId, unsatisfied)
merge(choiceId, thenId, elseId)
fixed_point(loopId, bodyId, condition)
backedge(bodyId, loopId)
```

## Validation

- Focused TypeScript compilation: PASS.
- Phase 235 semantic control relation data-flow runtime test: PASS.
- Adapter + semantic model focused TypeScript compilation: PASS.

## Principle

Do not mechanically remove every `if`/`for`/`while`. Remove semantic meaning encoded by those constructs. Parser decoding, collection traversal, worklists, and fixed-point iteration remain interpreter/solver mechanics. Semantic decisions belong to typed facts, relations, and rewrite rules.
