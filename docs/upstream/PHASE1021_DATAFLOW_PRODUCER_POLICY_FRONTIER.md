# Phase 1021 — DataFlow producer-policy frontier

## Trace result

The canonical `DataFlowInterface<Input, State, Node>` is correctly limited to:

- `seed`
- `derive`
- `close`
- `reaches`

`DataFlowConfigInterface` is downstream in `compiler/analysis/dataflow` and remains analysis policy (`isSource`, `isSink`, `isAdditionalFlowStep`, `isBarrier`).

The next producer domains are already named by `SemanticDataflowLineage`:

- `route`
- `controller`
- `model_relation`
- `resource`
- `schema`

The ecommerce Laravel fixture contains evidence for all five conceptual domains, but the current canonical input surface does **not** yet preserve those producer labels at fact granularity.

## Critical boundary finding

`semanticDataflowInputsFromSourceModel()` currently builds one controller-scoped `SemanticDataflowInput` by combining:

1. existing controller scanner dataflow;
2. route-parameter projection facts;
3. controller model/resource/response projection facts;
4. controller query projection facts.

The input has one `origin`, and the adapter currently defaults that origin to `controller` for the controller producer. Therefore a policy contributor that reads only `input.origin.lineage.producer` would incorrectly classify route/resource/query-derived facts as controller-originated.

This is a provenance-granularity problem, not a reason to widen `DataFlowInterface`.

## Recommended migration order

1. Keep `DataFlowInterface` unchanged.
2. Keep `DataFlowConfigInterface` in the analysis lane.
3. Add fact-level producer lineage to canonical input facts, or an equivalent typed producer annotation that survives closure/projection.
4. Introduce `DataFlowConfigContributorInterface` only after producer identity is available at the policy decision boundary.
5. Add independent contributors for route, controller, model relation, resource, and schema evidence.
6. Compose contributors into an analysis-specific `DataFlowConfigInterface`.
7. Never make `ManifestBuilder`, `ServiceGraphBuilder`, `SemanticDataflowInterface`, or `SemanticDataflowJudgment` own source/sink policy.

## Laravel evidence alignment

Laravel relationships such as `belongsTo`, `hasMany`, and `hasOne` are structural/model relation evidence. Query constraints such as `whereHas` are query semantics. Route parameters are route input evidence, while controller/resource response bindings are controller/resource projections.

The ecommerce fixture therefore validates the need for producer-specific policy, but not a universal source/sink classification.

## External framework alignment

CodeQL puts `isSource`, `isSink`, `isBarrier`, and `isAdditionalFlowStep` in an analysis configuration implementing `DataFlow::ConfigSig`; the flow engine consumes that configuration. MLIR similarly separates child `DataFlowAnalysis` from `DataFlowSolver`, with the solver orchestrating fixed-point execution and dependencies.

RouteSync should preserve the same separation: semantic execution stays canonical and producer/query policy stays composable in analysis.
