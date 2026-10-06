# Phase 1093 — Graph Relation Materialization Closure

Phase 1093 closes the remaining graph-node duplication found after the Phase 1092 controller/route surface closure.

## Authority

The canonical structural lane is now:

`Route / Controller / ModelRelation / Resource / Schema evidence`
`→ SemanticRelationGraph`
`→ structural semantic relation projection`
`→ GraphEdgeRelation`
`→ GraphEdgeRelationSink`
`→ ServiceGraph.edgeRelations / compatibility edges

The graph node payload is no longer a second structural relation authority.

## Changes

### Route/controller relation

`route_controller` is now projected into a closed graph edge:

- graph node vocabulary accepts `RouteReference`;
- graph edge type is `routes_to_controller`;
- graph relation origin is `route_controller`.

The graph projection no longer creates a `GraphRouteSurface`, and the compiler no longer mutates `ControllerNode.routes` from route input.

### Controller node

`ControllerNode` retains controller identity and action names, but no longer stores:

- `routes`;
- `calls`.

`calls` were already represented by canonical `controller_dependency` structural relations. Routes are now represented by canonical `route_controller` graph edges.

### Service node

`ServiceNode` no longer stores `dependencies`. Service dependencies remain graph-edge relations, with the existing compatibility `ServiceGraph.edges` materialization retained for downstream consumers.

### DataFlowInterface

No change. `DataFlowInterface<Input, State, Node>` remains domain-neutral and owns only seed/state/derive/close/reaches. Laravel, route, controller, model, resource, schema, manifest, and graph policy remain outside the generic dataflow contract.

### InterfaceDependencyBoundary

No change. Downstream wiring remains the owner of:

`InterfaceDependencyBoundary<Upstream, Downstream>`

with the directional operation:

`project(upstream) -> downstream`.

## Upstream/downstream trace

`examples/ecommerce-shop-source`
`→ Laravel scanner/subscanner evidence`
`→ upstream contracts + model relation/schema reconciliation`
`→ RouteSyncManifest`
`→ RouteSyncManifestFlow`
`→ RouteSyncManifestGraphProjectionInterface`
`→ GraphSurface`
`→ canonical SemanticRelationGraph`
`→ GraphEdgeRelation`
`→ GraphEdgeRelationSink`
`→ ServiceGraph`

Dataflow remains a separate lane:

`controller/request/query semantic evidence`
`→ SemanticDataflowInput`
`→ DataFlowInterface`
`→ semantic closure`
`→ IR projection`

## Legacy StaticLaravelScanner

No active production TypeScript reference remains. Historical phase documents may mention the deleted scanner and are not active dependencies.

## Validation

Structural audit:

`audit-phase1093-graph-relation-materialization-closure.cjs`

passes all checks.

The repository currently has no root `tsconfig.json` or `packages/core/tsconfig.json`, so this phase does not claim a TypeScript build result.
