# Phase 248 — Canonical Control Dependence

Semantic control scope is now elevated into a solver-derived control-dependence relation.

## Model

```text
control_scope(node, controller, predicate, polarity)
        |
        | declarative rewrite
        v
control_dependence(node, controller)
        |
        | recursive declarative rewrite
        v
control_dependence(node, ancestor-controller)
```

The relation solver computes the transitive closure to a fixed point. No AST traversal is used to determine nested control dependence.

`if`, `switch`, `while`, and `for` remain evidence forms only. Their semantic effect enters the engine as `choice`, `alternative`, `iteration`, `predicate`, and related relations.

## Rationale

This follows the semantic separation used by data-flow/static-analysis infrastructure: the semantic graph is not required to mirror syntax. CodeQL explicitly describes its data-flow graph as distinct from the AST; MLIR uses declarative match/rewrite programs; and fixed-point relation evaluation provides the execution mechanism.
