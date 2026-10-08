# Phase 1015 — DataFlowInterface upstream trace and micro-capability migration

## Canonical direction

The data-flow contract is intentionally split into four small upstream capabilities:

- `DataFlowSourceInterface<Input, State>` — seed/source materialization.
- `DataFlowStepInterface<State>` — one semantic derivation step.
- `DataFlowFixpointInterface<State>` — closure to the least fixed point.
- `DataFlowQueryInterface<State, Node>` — reachability/query over the closed state.

`DataFlowInterface<Input, State, Node>` is only their type-level composition. It is not a solver implementation and it does not contain downstream projection.

`DataFlowProjectionInterface<Input, Output>` is deliberately separate.

## RouteSync trace

```text
examples/ecommerce-shop-source
  -> Laravel route/controller/model evidence
  -> upstream source-model compiler
  -> ManifestBuilderInterface : DataFlowSourceInterface
  -> RouteSyncManifest.dataflowInputs
  -> SemanticDataflowInterface : Source + Step + Fixpoint + Query
  -> semanticDataflowAuthority.ts
  -> SemanticDataflowJudgment least fixed point
  -> IR projection OR Graph structural projection
```

Laravel relationship methods (`belongsTo`, `hasMany`, `hasOne`) remain structural relation evidence. Query constraints such as `whereHas` remain semantic/query evidence. Neither Graph nor Manifest becomes the data-flow solver.

## Projection boundaries

- `ManifestBuilderInterface` consumes the source capability and materializes seed facts once.
- `SemanticDataflowIRProjectionInterface` consumes `SemanticDataflowInterface` and only reads its closed judgment.
- `ServiceGraphBuilderInterface` consumes `RouteSyncManifestFlow` and materializes structural graph relations through `GraphEdgeRelationSink`.
- `DataFlowProjectionInterface` is not part of `DataFlowInterface`.

## CFG lane

The compiler CFG lane uses `ControlFlowDataFlowInterface<T>` with explicit forward/backward capabilities. It is a lower-level analysis interface and is not confused with the upstream semantic `DataFlowInterface`.

Raw `runForwardAnalysis` and `runBackwardAnalysis` remain implementation details of `DataFlowAnalysis`.

## Reference alignment

The design follows the separation used by CodeQL's `DataFlow::ConfigSig` + shared `DataFlow::Global` and MLIR's child `DataFlowAnalysis` + `DataFlowSolver`: small contracts describe analysis behavior while one shared authority/solver owns execution and fixed-point state.
