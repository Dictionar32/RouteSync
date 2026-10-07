# Phase 1147 — Semantic Dataflow Evidence Boundary

## Intent

Strengthen the upstream/dataflow migration without enlarging the generic `DataFlowInterface`.

## Boundary

`SemanticDataflowEvidence` is now a closed upstream transport contract containing:

- canonical semantic node identity
- source provenance
- normalized semantic input facts
- producer lineage category

`SemanticDataflowInputProducerInterface.create` accepts this single evidence value. The producer owns canonical input construction and fact lineage.

## Dependency direction

```text
scanner evidence
  -> scanner adapter
  -> SemanticDataflowEvidence
  -> SemanticDataflowInputProducerInterface
  -> SemanticDataflowInput
  -> semantic dataflow authority
  -> generic DataFlowInterface
  -> IR
```

`types/upstream` still imports neither `types/dataflow` nor compiler/analysis.

## Why not move the whole scanner knowledge model

`SemanticKnowledgeDataFlow` still contains scanner-specific semantic facts, compatibility projections, and legacy analysis consumers. Moving the entire file would relocate syntax/evidence coupling rather than improve the boundary. Phase 1147 therefore moves the **contract** first and keeps conversion ownership in the scanner adapter.

## TypeScript 6

The active root configuration remains explicit about `types` and uses `moduleResolution: Bundler`. No deprecated `moduleResolution: Node` exists in active `tsconfig.json` files. `target: ES2020` is intentionally retained for RouteSync runtime compatibility; TypeScript 6 does not require changing the runtime target.
