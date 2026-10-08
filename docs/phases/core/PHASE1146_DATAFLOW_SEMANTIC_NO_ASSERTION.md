# Phase 1146 — Dataflow semantic helper without assertion widening

The canonical upstream semantic dataflow helper `semanticDataflowFactWithLineage`
previously used a generic `T` plus `as T` to preserve the input subtype. That
assertion was unnecessary because all accepted inputs are already the closed
`SemanticDataflowInputFact` algebra.

The helper now accepts and returns `SemanticDataflowInputFact` directly. This
keeps the semantic authority closed and removes assertion-based widening from
the canonical dataflow path.

## Boundary

```text
Laravel / scanner evidence
  -> CompleteLaravelSourceModel
  -> SemanticDataflowInputProducerInterface
  -> SemanticDataflowInputFact
  -> createSemanticDataflowJudgment
  -> DataFlowInterface<Input, State, Node>
  -> downstream analysis / IR
```

`DataFlowInterface` remains generic and execution/state/query oriented. It does
not acquire Laravel vocabulary. Structural relations remain on the graph lane.

## TypeScript 6

The workspace is already pinned to TypeScript `^6.0.3`. TypeScript 6 recommends
explicit `types` entries and modern module defaults; RouteSync retains its
explicit Node/Vitest types and explicit bundler resolution rather than relying
on ambient discovery.
