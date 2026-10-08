# Phase 1048 — Canonical DataFlow Runtime Boundary

## Trace

The current dependency path is:

`Route / Controller / Request / ModelRelation / Resource / Schema -> Manifest -> SemanticDataflowInput -> canonical DataFlowInterface`

The structural graph path remains independent:

`Route / Controller / ModelRelation / Resource / Schema -> StructuralSemanticRelation -> GraphEdgeRelation -> ServiceGraph`

The ecommerce fixture remains the integration source used by the existing route/controller/model/resource/schema/dataflow audits.

## Runtime correction

Phase 1047 correctly removed erased `any` parameters from `DataFlowProjectionInterface`, but the production analysis pipeline still constructed the compatibility `SemanticDataflowInterface` object and relied on the generic return type to hide its duplicate `judgment` and `authority` fields.

Phase 1048 removes that runtime leakage.

`createSemanticDataflowDataFlowInterface()` now constructs an object whose public runtime surface is exactly the canonical `DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>`:

- `seed`
- `state`
- `derive`
- `close`
- `reaches`

It does not expose a second `judgment` or `authority` field.

The older `SemanticDataflowInterface` remains only as a compatibility/authority surface for already-traced tests and upstream construction. It is not used by the production analysis pipeline.

## Projection boundary

`DataFlowProjectionInterface<Input, State, Node, Output>` remains a strict specialization of:

`InterfaceDependencyBoundary<DataFlowInterface<Input, State, Node>, Output>`

All four generic parameters remain explicit; no `any` or erased generic occurs in the projection contract.

IR is the only current `DataFlowProjectionInterface` consumer because it genuinely materializes canonical dataflow state.

Graph remains structural and therefore uses:

`InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>`

rather than a dataflow projection.

## External alignment

CodeQL separates a generic data-flow solver from source/sink/barrier configuration. MLIR's data-flow analyses maintain analysis state and iterate toward fixpoints. LLVM separates analysis results from consuming passes and provides an analysis manager for reuse/invalidation. Laravel exposes request input and route parameters to controller code as application evidence. These patterns support one canonical analysis state authority with narrow downstream consumer/materialization boundaries.
