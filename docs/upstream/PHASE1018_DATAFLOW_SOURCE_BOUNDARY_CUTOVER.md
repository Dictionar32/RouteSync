# Phase 1018 — DataFlow source boundary cutover

Phase 1017 separated `DataFlowInterface` execution from `DataFlowConfigInterface` analysis policy. The remaining upstream coupling was a semantic naming leak: `ManifestBuilderInterface` inherited `DataFlowSeedInterface`, even though manifest construction is not a data-flow seed operation.

## Cutover

`ManifestBuilderInterface` now owns only manifest construction:

```text
SourceProjectIdentity
        |
        v
ManifestBuilderInterface.build()
        |
        v
RouteSyncManifest.dataflowInputs  -- seed facts only
        |
        v
SemanticDataflowInterface
  = source + step + fixpoint + query
```

The obsolete compatibility aliases `DataFlowSeedInterface`, `DataFlowDerivationInterface`, `DataFlowClosureInterface`, and `DataFlowReachabilityInterface` were removed because repository search found no production consumer after the micro-capability migration. The canonical names remain `DataFlowSourceInterface`, `DataFlowStepInterface`, `DataFlowFixpointInterface`, and `DataFlowQueryInterface`.

## Ownership

- Manifest construction does not implement data-flow semantics.
- `SemanticDataflowInterface` remains the only semantic execution/closure authority.
- `DataFlowConfigInterface` is analysis/query policy and now lives in `compiler/analysis/dataflow`, not in the upstream semantic type lane.
- Graph remains a structural projection through `GraphEdgeRelationSink`.
- IR remains a projection of the closed semantic judgment.

## External alignment

CodeQL separates flow configuration (`isSource`, `isSink`, barriers, and additional steps) from the data-flow engine. MLIR separates child `DataFlowAnalysis` from `DataFlowSolver`, which orchestrates fixed-point execution. RouteSync now follows the same ownership direction: manifest construction, semantic execution, policy configuration, and downstream projection are distinct boundaries.

Laravel Eloquent relation declarations (`belongsTo`, `hasMany`, `hasOne`) remain structural relation evidence, while relationship-constrained queries such as `whereHas` remain semantic query evidence. Neither should be promoted into universal source/sink policy merely because they participate in the ecommerce fixture.
