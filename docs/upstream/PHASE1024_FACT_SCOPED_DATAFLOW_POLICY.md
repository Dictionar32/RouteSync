# Phase 1024 — Fact-Scoped Dataflow Policy Boundary

Phase 1023 introduced composable `DataFlowConfigContributorInterface` policy.
The next boundary is fact-scoped selection: an analysis selects individual
semantic facts before projecting them into source/sink/additional-step/barrier
predicates.

This prevents producer lineage (`route`, `controller`, `model_relation`,
`resource`, `schema`) from becoming a global source/sink classification.
`SemanticDataflowFactLineage` remains upstream semantic provenance. The selector
lives in `compiler/analysis/dataflow`, because choosing which facts matter is
analysis policy.

## Boundary

```text
semantic facts + fact lineage
          |
          v
DataFlowFactPolicyInterface
          |
          v
selected facts
          |
          v
DataFlowConfigContributorInterface
          |
          v
DataFlowConfigInterface
```

`DataFlowInterface` is unchanged: `seed`, `derive`, `close`, and `reaches`
remain the semantic execution contract. Graph and IR remain projections and do
not acquire a second solver.

## Producer rule

No universal rule is introduced such as `route = source`, `resource = sink`,
`model_relation = additional step`, or `schema = source`. A concrete analysis
must select the exact fact classes it intends to model.
