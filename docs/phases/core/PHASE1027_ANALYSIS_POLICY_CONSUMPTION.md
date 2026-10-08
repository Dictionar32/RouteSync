# Phase 1027 — Production Fact-Scoped Analysis Policy Consumption

Phase 1026 introduced a concrete fact-scoped source/sink policy, but the production manifest analysis boundary did not yet consume that policy. Phase 1027 closes that wiring gap without moving analysis policy into the upstream `DataFlowInterface`.

## Boundary

```text
Laravel scanner / manifest seed
  -> SemanticDataflowInput
  -> SemanticDataflowAuthority
  -> SemanticDataflowJudgment (least fixed point)
  -> analyzeRouteSyncManifestDataflow()
  -> analyzeRouteSyncManifestDataflowWithPolicy(context)
  -> fact-scoped selector
  -> DataFlowConfigContributor composition
  -> analysis-specific source/sink query
```

The caller must explicitly provide `sourceProducers` and `sinkProducers`. Producer domains are therefore not globally classified as source or sink.

## Ownership

- `DataFlowInterface` remains source/step/fixpoint/query execution only.
- `SemanticDataflowAuthority` remains the sole semantic closure authority.
- Manifest remains seed-only.
- Graph remains a downstream structural projection.
- IR remains a downstream semantic-dataflow projection.
- Route, controller, resource, model-relation, and schema provenance remain fact-scoped evidence.

## External correspondence

CodeQL documents the same separation: an analysis configuration chooses sources and sinks and may optionally add flow steps or barriers; the generic solver performs the flow query.

MLIR similarly separates a `DataFlowSolver` from child `DataFlowAnalysis` implementations and runs them to a fixed point before querying analysis state.
