# Phase 1127 — End-to-End Semantic Surface Trace

Direction: `upstream => wiring => interface => downstream`

## Authority

- `types/upstream/semanticReferences.ts` owns canonical semantic relations.
- `types/upstream/manifest.ts` carries the resolved `SemanticRelationGraph` through `RouteSyncManifestFlow`.
- `types/dataflow/dataFlowInterface.ts` remains generic and owns only execution/state/query capabilities.
- `types/interfaces/interfaceDependencyBoundary.ts` remains a generic downstream-owned projection boundary.

## Downstream projections

- Graph consumes `RouteSyncManifestFlow.relations` and projects it into graph-owned contracts.
- `graph/service/graphRelation.ts` is downstream-owned; upstream does not define graph-edge authority.
- Dataflow receives its dedicated projection surface through `InterfaceDependencyBoundary`.
- IR consumes the generic `DataFlowInterface` state and does not reconstruct semantic closure.

## Provenance

- Route/controller/resource are runtime dataflow lineage producers.
- `model_relation` and `schema` remain structural semantic/provenance evidence, not fake runtime dataflow producers.
- Model relation identity and schema foreign-key evidence remain conserved through graph projection.

## Legacy / CLI

- `StaticLaravelScanner` and `LaravelScanner` have no production references.
- CLI production code consumes the `@routesync/core` package surface rather than `packages/core/src`.
- `examples/ecommerce-shop-source` remains the end-to-end conservation fixture for route/controller/model/relation/resource/schema evidence.

## Result

Phase 1127 is a closure audit. It intentionally does not widen `DataFlowInterface` or make `InterfaceDependencyBoundary` Laravel-specific.
