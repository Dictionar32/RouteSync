# Phase 1017 — DataFlow configuration policy separation

The upstream trace now separates **data-flow execution** from **analysis/query configuration**.

## Contract split

- `DataFlowInterface<Input, State, Node>` composes source/step/fixpoint/query operations.
- `DataFlowConfigInterface<Node>` composes `isSource`, `isSink`, `isAdditionalFlowStep`, and `isBarrier`.
- `DataFlowProjectionInterface<Input, Output>` remains downstream materialization and is not part of either contract.

`SemanticDataflowInterface` now extends only `DataFlowInterface`. The semantic authority owns the canonical least-fixed-point judgment, but does **not** prescribe a universal source/sink policy.

This follows the CodeQL `DataFlow::ConfigSig` pattern: source, sink, barrier, and additional-flow-step predicates belong to the analysis configuration, while the shared data-flow engine performs the flow query. citeturn0search0turn0search3

MLIR similarly separates child `DataFlowAnalysis` from `DataFlowSolver`; the solver orchestrates dependency processing and fixed-point iteration instead of embedding every analysis policy. citeturn0search7turn0search10

## RouteSync ownership

```text
Laravel route/controller/model/query evidence
        ↓
ManifestBuilderInterface
        ↓
SemanticDataflowInput (seed only)
        ↓
SemanticDataflowInterface
        ↓
semanticDataflowAuthority / least fixed point
        ↓
IR / Graph projections

query-specific analysis
        ↓
DataFlowConfigInterface
        ├── source
        ├── sink
        ├── additional step
        └── barrier
```

The existing ecommerce fixture is especially useful here because Eloquent relationships are structural evidence while relationship-constrained queries such as `whereHas` are query semantics; they should not silently become universal source/sink policy. Laravel documents relationship querying and relationship constraints as separate API concerns. citeturn0search13

No second solver was introduced.
