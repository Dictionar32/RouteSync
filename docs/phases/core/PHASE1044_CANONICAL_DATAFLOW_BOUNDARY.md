# Phase 1044 — Canonical DataFlowInterface / InterfaceDependencyBoundary trace

Phase 1043 moved the generic `DataFlowInterface` out of `types/upstream` because it is an execution/state/query authority consumed by downstream layers, not an upstream domain producer contract.

## Boundary

- `types/upstream/*` produces domain facts, evidence, relations, and semantic authority specializations.
- `types/dataflow/dataFlowInterface.ts` owns the generic execution/state/query contract.
- `types/interfaces/interfaceDependencyBoundary.ts` expresses a one-way upstream-to-downstream materialization dependency.
- `DataFlowProjectionInterface` is a narrow specialization only when the upstream input is actually `DataFlowInterface`.
- Graph uses `InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>` because graph input is structural manifest flow, not dataflow state.
- IR uses `DataFlowProjectionInterface<DataFlowInterface<...>, SemanticDataflowIRProjection>` because IR genuinely projects canonical dataflow state.

## Consumer trace

`Route -> Controller -> Request -> ModelRelation -> Resource -> Schema -> Manifest`
produce evidence/facts/relations -> `SemanticDataflowInput` -> `DataFlowInterface` -> AST/IR/policy/query consumers.

The structural graph lane remains:

`Route/Controller/ModelRelation/Resource/Schema -> StructuralSemanticRelation -> GraphEdgeRelation -> ServiceGraph`.

No upstream producer imports `InterfaceDependencyBoundary` or `DataFlowProjectionInterface`.

## External alignment

CodeQL separates data-flow configuration (`ConfigSig`) from the global flow engine/query. MLIR attaches evolving data-flow state to analysis anchors and reaches fixpoints. LLVM separates analyses from passes and provides analysis results through an analysis manager. Laravel request input and matched route parameters remain upstream evidence rather than a solver contract.
