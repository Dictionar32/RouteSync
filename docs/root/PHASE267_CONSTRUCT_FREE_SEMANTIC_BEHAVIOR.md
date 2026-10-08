# Phase 267 — Construct-Free Semantic Behavior Kernel

RouteSync now has a semantic behavior kernel whose ontology does not contain
source-control constructs or renamed versions of them.

## Canonical boundary

```text
source syntax
  -> evidence
  -> semantic relations
  -> constraints
  -> relational fixed point
  -> rewrite closure
  -> target representation
```

The canonical behavior vocabulary is:

- `entity`
- `condition`
- `candidate`
- `requires`
- `permits`
- `excludes`
- `precedes`
- `reaches`
- `converges`
- `recurs`
- `invariant`
- `depends`
- `produces`
- `consumes`
- `transfers`
- `effects`

There is intentionally no semantic `if`, `switch`, `while`, `for`, `choice`,
`decision`, `repetition`, `loop`, or `branch` concept in this kernel.

## Why this is higher-level

Tree-sitter provides syntax evidence. CodeQL explicitly distinguishes AST from
semantic data-flow nodes. Soufflé makes relations and fixed points first-class.
MLIR makes declarative rewriting first-class, but its rewrite patterns still
operate over an operation/DAG representation. K elevates executable semantics
to configurations and rewrite rules, while SeaHorn lowers verification
conditions to constrained Horn clauses. cvc5 supplies a theory solver for
relations and transitive closure. RouteSync combines the useful ideas into a
compiler-specific semantic boundary where source-control syntax is not the
semantic ontology.

## Architectural rule

A source construct may produce evidence, but downstream semantic reasoning may
only consume relational facts. Target-specific lowering may later choose a
representation such as a conditional or loop, but that representation is not
allowed to feed semantic truth back into the canonical model.
