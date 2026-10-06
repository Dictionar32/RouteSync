# Phase 1047 — Explicit DataFlow Projection Boundary

## Trace

The upstream lane remains:

`Route / Controller / Request / ModelRelation / Resource / Schema -> Manifest -> SemanticDataflowInput -> DataFlowInterface`

The structural lane remains:

`Route / Controller / ModelRelation / Resource / Schema -> StructuralSemanticRelation -> GraphEdgeRelation -> ServiceGraph`

IR is the only current `DataFlowProjectionInterface` consumer because it genuinely projects a canonical `DataFlowInterface` result.

## Boundary

`InterfaceDependencyBoundary<Upstream, Downstream>` remains the generic directional dependency boundary.

`DataFlowProjectionInterface` is a strict specialization:

`DataFlowProjectionInterface<Input, State, Node, Output> extends InterfaceDependencyBoundary<DataFlowInterface<Input, State, Node>, Output>`

The four data-flow parameters are explicit. The projection contract does not erase them through an unconstrained or erased generic type.

## Consumer rule

Downstream consumers consume `DataFlowInterface<Input, State, Node>` directly. A projection is a materialization boundary, not a second solver or authority.

Graph remains structural and therefore continues to use `InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>` rather than `DataFlowProjectionInterface`.

## External alignment

CodeQL separates a generic data-flow solver from source/sink/barrier configuration. MLIR analysis state evolves toward fixpoints. LLVM separates analysis results from consuming passes. These patterns support keeping one canonical data-flow state authority and narrow consumer boundaries.
