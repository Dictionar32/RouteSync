# Phase 1122 — Semantic dataflow provenance and closure conservation

Direction:

```text
upstream => wiring => interface => downstream
```

## Result

The semantic relation/dataflow trace is conserved through the complete RouteSync path:

```text
route/controller/model_relation/resource/request/schema evidence
  => canonical upstream semantic facts/relations
  => source-model relation graph + closed semantic dataflow judgment
  => manifest flow wiring
  => generic InterfaceDependencyBoundary / DataFlowInterface
  => graph / dataflow / IR projections
```

## Canonical relation coverage

`SemanticRelation` in `semanticReferences.ts` remains the authority for all structural
relations:

- `resource_model`
- `model_relation`
- `request_property`
- `response_resource`
- `response_model`
- `route_request`
- `route_response`
- `route_controller`
- `controller_resource`
- `controller_model`
- `controller_response`
- `controller_dependency`

Policy relations remain canonical upstream in `controllerActionPolicyRelations.ts` and
`routeActionPolicyRelations.ts`:

- `controller_action_middleware_policy`
- `controller_action_authorization_policy`
- `route_action_middleware_policy`
- `route_action_authorization_policy`

`highLevelSourceModel.ts` constructs the canonical relation graph once from its
source-model catalogs. `upstreamManifestScanner.ts` transports that graph through
`RouteSyncManifestFlow`; graph projection preserves the graph rather than rebuilding it.

## DataFlowInterface boundary repair

The generic `DataFlowInterface<Input, State, Node>` remains downstream execution/state/query
infrastructure. It contains no Laravel-specific route/controller/model/resource/schema
semantics.

The semantic-dataflow adapter now has this ownership rule:

- `seed(input)` invokes the upstream semantic authority once to construct a closed judgment.
- `state` exposes that closed judgment.
- `derive(state)` is identity-preserving.
- `close(state)` is identity-preserving.
- `reaches(...)` queries the already-closed closure.

Therefore downstream `derive`/`close` cannot silently recompute upstream semantic closure.
The semantic closure authority remains `semanticDataflowAuthority.ts`.

## IR conservation

`SemanticDataflowIRProjection` reads `dataflow.state.closure` and projects facts using the
canonical `semanticDataflowIdentityKey`. It does not invoke the semantic-dataflow authority
or reconstruct reachability.

Fact provenance remains closed to the producer vocabulary:

```text
request | route | controller | model_relation | resource | schema
```

## Boundary ownership

`InterfaceDependencyBoundary<Upstream, Downstream>` remains generic and directional. The
downstream projection owns the boundary; upstream producers do not import downstream
boundary interfaces merely to become consumable.

`DataFlowProjectionInterface` is the narrow specialization only when the upstream value is
actually a `DataFlowInterface`.

## Legacy / CLI / fixture closure

- Production `StaticLaravelScanner` / `LaravelScanner` references: 0.
- CLI production direct imports into `packages/core/src`: 0.
- Ecommerce fixture retains route, controller, model relation, resource, migration/schema evidence.
- No production compiler import exists in `types/upstream`.

## Audit

`packages/core/scripts/audits/audit-phase1122-semantic-dataflow-provenance.cjs` checks the
relation families, policy families, manifest/graph conservation, fact lineage, closed-state
adapter behavior, IR projection boundary, generic interfaces, legacy isolation, CLI surface,
and ecommerce fixture.

Phase 1122 audit result: **PASS**.
