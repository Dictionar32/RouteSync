# Phase 1049 — DataFlow / InterfaceDependencyBoundary Trace Repair

Phase 1049 repairs the audit frontier after the Phase 1048 runtime boundary cutover.
No second dataflow solver or new upstream domain interface is introduced.

## Canonical dependency direction

```text
Route / Request / Controller / Resource
        │
        ▼
SemanticDataflowInput
        │
        ▼
SemanticDataflowJudgment
        │
        ▼
DataFlowInterface<Input, State, Node>
        │
        ├── analysis / query
        │
        └── IR projection

Route / Controller / ModelRelation / Resource / Schema
        │
        ▼
StructuralSemanticRelation
        │
        ▼
GraphEdgeRelation
        │
        ▼
ServiceGraph
```

`ModelRelation` and `Schema` remain structural/provenance inputs. They are not
promoted to automatic value-flow sources merely because they participate in the
graph. A relation becomes dataflow only when explicit semantic evidence produces
a `SemanticDataflowInputFact`.

## Boundary contracts

- `DataFlowInterface<Input, State, Node>` is domain-neutral and owns execution,
  state, derivation/fixpoint, and reachability query operations.
- `InterfaceDependencyBoundary<Upstream, Downstream>` is directional: the
  downstream projection owns the boundary and receives an upstream value.
- `DataFlowProjectionInterface<Input, State, Node, Output>` is only a strict
  specialization when the upstream value is actually a `DataFlowInterface`.
- IR is the current dataflow projection consumer.
- Graph uses `InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>`
  because graph construction consumes structural manifest flow, not dataflow state.
- Upstream route/controller/model-relation/resource/schema/manifest files do not
  import downstream projection boundaries.

## Repair

Two stale audits were synchronized with the Phase 1048 contract:

1. Phase 1042 now recognizes the explicit four-parameter
   `DataFlowProjectionInterface<Input, State, Node, Output>` specialization.
2. Phase 1040 now verifies IR consumption through that four-parameter projection
   while requiring the canonical `DataFlowInterface` state as its source.
3. Phase 1049 adds a regression audit covering the complete upstream → downstream
   boundary and ecommerce fixture presence.

The production runtime remains unchanged because Phase 1048 already removed the
compatibility `SemanticDataflowInterface` object from the production pipeline.

## External alignment

CodeQL separates the generic flow solver from source/sink/barrier/additional-step
configuration; MLIR separates generic interfaces from concrete implementations;
LLVM separates analysis results from consuming passes and centralizes analysis
results for reuse/invalidation; Laravel exposes request input and route parameters
to controller code as application evidence. These patterns support keeping the
RouteSync execution contract narrow and placing materialization at downstream
boundaries.
