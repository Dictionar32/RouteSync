# Phase 1121 — Semantic Relation Conservation

Direction: `upstream => wiring => interface => downstream`

## Canonical authority

`types/upstream/semanticReferences.ts` is the sole production authority for
`StructuralSemanticRelation`, `SemanticRelation`, and `SemanticRelationGraph`.
The structural families audited here are:

- `route_controller`
- `controller_model`
- `model_relation`
- `controller_resource`
- `response_resource`
- `resource_model`
- `route_request`
- `route_response`

The source-model builder constructs the relation graph once from the canonical
source catalog. The manifest flow transports that graph without reclassification,
and the graph projection forwards the same canonical graph as its relation surface.

## Boundary

```text
Laravel / PHP source
  -> upstream evidence and semantic relations
  -> wiring / lowering
  -> InterfaceDependencyBoundary
  -> graph / dataflow / IR / CLI
```

`DataFlowInterface<Input, State, Node>` remains framework-neutral. Laravel-specific
source/sink/barrier/policy semantics belong to analysis configuration and upstream
semantic facts, not to the generic execution/query contract.

`InterfaceDependencyBoundary<Upstream, Downstream>` remains generic and directional.
The downstream projection owns the boundary; upstream provides the semantic input.

## Conservation invariant

Downstream graph construction must consume `RouteSyncManifestFlow.relations` and
must not reconstruct route/controller/model/resource semantics from AST or from a
second relation algebra.

The IR/dataflow layers remain projections of their respective canonical inputs.

## Legacy and fixture checks

Production references to `StaticLaravelScanner` / the retired Laravel scanner lane
must remain empty. `examples/ecommerce-shop-source` remains the regression oracle
for route -> controller -> model_relation -> resource -> schema coverage.
