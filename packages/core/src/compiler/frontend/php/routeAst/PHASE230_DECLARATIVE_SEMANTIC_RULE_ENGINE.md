# Phase 230 — Declarative Semantic Rule Engine

RouteSync now has a typed rule-interpreter layer for semantic decisions that previously appeared as consumer-side `if`/`===`/`switch` logic.

## Boundary

```text
syntax/evidence
    ↓
canonical semantic facts
    ↓
declarative semantic rules
    ↓
typed consequences
    ↓
analysis / solver / emitter
```

The evaluator's loops and predicates are implementation mechanics. Domain meaning is carried by `SemanticRule` registries: pattern constraints, priority, and typed consequence.

## Migrated policies

- assignment operator → memory effect
- assignment reference → alias evidence
- data-flow role → callable boundary

These policies no longer require consumers to encode their domain mapping with direct semantic comparisons.

## Important distinction

This does **not** attempt to delete every `if`, `while`, `switch`, or `for`. Traversal, fixed-point iteration, validation, and interpreter mechanics still need control flow. The architectural target is narrower and stronger: semantic knowledge must stop being encoded by control-flow syntax.

`Map`/`Set` remain derived indexes only; the rule registry and canonical semantic facts are the semantic source of truth.
