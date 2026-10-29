# Phase 169 — Data-Flow Model Is Not a CFG

## Principle

The canonical Knowledge/Data-Flow Model must not become a control-flow graph with semantic
names attached to its edges.

A construct may describe control semantics, but its canonical representation must remain data:
- `if` is a `SemanticDecision` with a `SemanticPredicate` and typed `SemanticOutcome` facts.
- `while` / `for` / `foreach` are `SemanticIteration` facts whose condition/body/clauses are data.
- `switch` / `match` are `SemanticSelection` facts with subject, match facts, and outcomes.
- `return` / `throw` are `SemanticTransition` facts carrying typed transition values.
- exception boundaries are facts containing their semantic regions.

## Change in Phase 169

Removed `reenters` from the canonical semantic relation vocabulary and producer.

Previously:

```text
Iteration ──reenters──> Body
```

That edge encoded execution behavior directly in the source-of-truth graph. The `body` is already
an explicit field of `SemanticIteration`; an interpreter can derive repetition from the iteration
semantics when execution is required.

Now:

```text
SemanticIteration
├── definition
├── condition
├── initializer
├── update
├── iterable
├── target
└── body
```

No synthetic back-edge is required.

## Why this is data-flow oriented

MLIR's data-flow framework explicitly builds dependency graphs and analyses information propagated
across control-flow constructs rather than making the control-flow construct itself the data-flow
fact. Its documentation describes analyses as building dependency graphs and transfer functions,
while control-flow constructs provide the context through which information is propagated.

RouteSync follows the same separation:

```text
Syntax evidence
      ↓
Semantic Knowledge
      ↓
Typed data dependencies / relations
      ↓
Data-flow analysis / interpretation
      ↓
Control-flow interpretation when required
```

Tree-sitter remains syntax evidence. Its official documentation describes its output as a concrete
syntax tree whose nodes correspond to grammar symbols; therefore the canonical semantic model must
not simply mirror those node names.

## Invariant

If removing a relation would only remove an execution edge but would not remove semantic knowledge,
the execution edge does not belong in the canonical Knowledge/Data-Flow source of truth.
