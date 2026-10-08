# Phase 1019 — DataFlow config downstream cutover

Phase 1018 removed the manifest-as-dataflow-source naming leak. The next trace showed that `DataFlowConfigInterface` itself had no production consumer in the upstream semantic lane.

## Cutover

`DataFlowInterface` remains upstream because `SemanticDataflowInterface` composes it as the canonical semantic execution contract. `DataFlowConfigInterface` moves to `compiler/analysis/dataflow` because `isSource`, `isSink`, `isAdditionalFlowStep`, and `isBarrier` are analysis/query policy rather than intrinsic semantic meaning.

```text
upstream/types
  DataFlowInterface
       |
       v
  SemanticDataflowInterface

compiler/analysis/dataflow
  DataFlowConfigInterface
       |
       v
  analysis-specific policy
```

## External alignment

CodeQL defines `ConfigSig` as a configuration module supplied to the data-flow library; it selects sources, sinks, barriers, and additional flow steps rather than becoming the semantic node algebra. MLIR similarly separates analysis implementations from the `DataFlowSolver` that orchestrates fixed-point execution.

## Laravel implication

Laravel route parameters, Eloquent relationships, and `whereHas` remain evidence/producers. They should contribute to a concrete analysis configuration only when a particular query asks for a source, sink, barrier, or extra flow edge. They must not be globally classified merely because they occur in the ecommerce fixture.
