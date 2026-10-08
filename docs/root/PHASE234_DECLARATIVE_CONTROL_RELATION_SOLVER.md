# Phase 234 — Declarative Control Relation Solver

## Goal

Move the semantic interpretation of `if`, `switch`, `while`, and `for` away from
source-control branching and into a relation program solved to a fixed point.

The parser/lexer may still decode source syntax. That is evidence acquisition.
The semantic layer consumes relations:

- `choice`
- `predicate`
- `alternative`
- `iteration`
- `successor`
- `guard`
- `merge`
- `fixed_point`
- `backedge`

## Research basis

MLIR PDLL separates pattern matching from rewrite and represents constraints and
rewrites declaratively. MLIR DRR similarly defines source patterns, constraints,
and result patterns. LLVM MemorySSA represents memory state with versioned
`MemoryDef`, `MemoryUse`, and `MemoryPhi` nodes instead of making source syntax
the semantic state representation.

## Architecture

```text
parser / lexer evidence
        |
        v
canonical semantic facts
        |
        v
control relation facts
        |
        v
SEMANTIC_CONTROL_RELATION_RULES
        |
        v
solveSemanticRelations()
        |
        v
saturated semantic control relations
```

The solver remains generic interpreter mechanics. Domain meaning is entirely in
the relation patterns and rewrites.

## Important boundary

Not every `if`/`while` in the compiler must disappear. Traversal, parsing,
validation, worklists, and fixed-point execution require mechanical control flow.
What must not remain is a semantic decision whose meaning is encoded only by a
source-control branch.
