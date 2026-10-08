# Phase 170 — Transition and Exception Knowledge as Data, Not Control Flow

## Principle

The canonical semantic Knowledge/Data-Flow model must not encode execution control-flow as semantic relations.

Syntax such as `return`, `throw`, `try`, `catch`, and `finally` is evidence used to produce typed knowledge.
It is not itself the ontology of the semantic graph.

## Changes

### Transitions

`return` and `throw` remain `SemanticTransition` facts. Their payload value is represented directly in the fact.
The graph relation is now `depends_on` rather than `returns` or `throws`.

This prevents the same knowledge from being represented twice:

- transition definition: what semantic transition exists
- value: what value it carries
- dependency edge: which value the transition depends on

### Exceptions

`SemanticExceptionHandler` is now a first-class fact containing:

- exception type
- optional catch variable as explicit semantic presence
- handler body region
- provenance

`SemanticExceptionBoundary` contains:

- protected body
- catch-handler knowledge IDs
- explicit finally-block presence

The canonical relation vocabulary no longer contains:

- `throws`
- `returns`
- `catches`
- `executes_finally`
- `reenters`

These are execution/control-flow interpretations, not data-flow dependencies.

Structural membership remains represented through `contains` where appropriate.

## Result

Canonical graph:

```text
Transition(return)
  └── depends_on ──> Value

ExceptionBoundary
  ├── contains ──> ProtectedRegion
  ├── contains ──> ExceptionHandler
  │                  ├── depends_on ──> ExceptionType
  │                  └── contains ──> HandlerRegion
  └── contains ──> FinallyRegion
```

The interpreter/analysis layer may derive execution behavior from these facts. The semantic graph itself does not become a CFG.
