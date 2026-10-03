# Phase 243 — Declarative Control Relation Program

## Goal

Raise semantic meaning of conditional, multiway, and iteration control into
relations evaluated by the generic fixed-point relation solver. Source
constructs such as `if`, `switch`, `while`, and `for` are evidence only.

## Declarative control algebra

```text
choice(control, conditional|multiway)
predicate(control, predicate)
alternative(control, outcome, polarity, continuation)
iteration(loop, kind, body)
successor(loop, body, loop)
```

The relation program derives:

```text
choice(...)
    -> control_kind(...)

choice + alternative
    -> branch(...)

choice + predicate + alternative
    -> guard(...)

guards / alternatives
    -> merge(...)

iteration + successor
    -> fixed_point(...)
    -> backedge(...)
```

Phase 242 then derives versioned control state:

```text
branch -> control_def
merge + branch definitions -> control_phi
fixed_point + backedge -> loop_header
```

## Why this is beyond syntax

CodeQL documents that a data-flow graph does not mirror AST structure and
that an `if` statement need not be a data-flow node. MLIR PDLL similarly
separates declarative pattern matching from rewriting. LLVM MemorySSA shows
how versioned state and phi-like merges can be represented as an analysis
layer rather than as syntax.

References:

- https://codeql.github.com/docs/writing-codeql-queries/about-data-flow-analysis/
- https://mlir.llvm.org/docs/PDLL/
- https://mlir.llvm.org/docs/PatternRewriter/
- https://www.llvm.org/docs/MemorySSA.html

## Phase 243 change

`control_kind` is now a first-class relation schema and is produced by
rewrite rules. The old procedural semantic lookup table was removed.
Consumers must consume solved `control_kind` facts instead of asking a
function to classify a control construct.

## Validation

- strict focused TypeScript compilation: PASS
- conditional relation derivation: PASS
- multiway relation derivation: PASS
- iteration/fixed-point derivation: PASS
- no `semanticControlKindFor` procedural semantic lookup remains
