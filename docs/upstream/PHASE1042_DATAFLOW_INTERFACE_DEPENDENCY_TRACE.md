# Phase 1042 — DataFlowInterface / InterfaceDependencyBoundary upstream=>downstream trace

## Scope

Trace the upstream contracts under `types/upstream` and the concrete Laravel fixture
through manifest, graph, AST analysis, IR, route, controller, model relation, resource,
and schema surfaces. The goal is to keep `DataFlowInterface` as the single semantic
dataflow execution/state/query contract while making generic upstream=>downstream
projection dependencies explicit through `InterfaceDependencyBoundary`.

## Decision

`DataFlowInterface<Input, State, Node>` remains the sole generic dataflow execution,
state, fixpoint, and reachability contract.

`InterfaceDependencyBoundary<Upstream, Downstream>` is the generic directional boundary:
downstream owns a projection/consumer operation over an upstream value. Upstream contracts
must not import this boundary merely to become consumable downstream.

`DataFlowProjectionInterface<Input, Output>` remains a narrow specialization of that
boundary for projections whose input is actually a `DataFlowInterface`.

Graph does **not** use `DataFlowProjectionInterface`: `ServiceGraphBuilder` consumes a
`RouteSyncManifestFlow` structural/semantic source-model surface, not a dataflow execution
state. It now extends `InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>`.

## Traced lanes

```text
Laravel route/controller/request/model/resource/schema evidence
        |
        v
Route / Controller / Request / ModelRelation / Resource / Schema
        |
        +--> SemanticDataflowInput
        |        |
        |        v
        |   DataFlow authority
        |        |
        |        v
        |   DataFlowInterface
        |        |
        |        +--> AST analysis consumer
        |        +--> IR projection consumer
        |        +--> dataflow policy consumer
        |
        +--> structural relations
                 |
                 v
          GraphEdgeRelation -> ServiceGraph
```

## Boundary audit

- `types/upstream/route.ts`: upstream route facts/contracts; no dependency on the generic
  dataflow execution interface.
- `types/upstream/controller.ts`: upstream controller/request-flow evidence; no dependency
  on downstream projection interfaces.
- `types/upstream/modelRelation.ts`: relation contract; remains structural/semantic input.
- `types/upstream/resource.ts`: representation/binding facts; remains upstream evidence.
- `types/upstream/schema.ts`: schema/migration contract; remains upstream evidence.
- `semanticDataflowManifestSurface.ts`: seed assembly only; no closure/reachability authority.
- `SemanticDataflowInterface`: producer-side semantic specialization of `DataFlowInterface`.
  It is not used as a downstream-specific projection contract.
- `compiler/analysis/*`: consumes the generic `DataFlowInterface` where dataflow state/query
  is required.
- `compiler/ir/SemanticDataflowIRProjection.ts`: consumes generic `DataFlowInterface`
  through `DataFlowProjectionInterface`; reads canonical `state` and never reconstructs closure.
- `graph/ServiceGraphBuilder.ts`: consumes `RouteSyncManifestFlow` through the generic
  `InterfaceDependencyBoundary`, not through `DataFlowProjectionInterface`.
- `astDataflowInterface.ts`: deprecated compatibility alias only; no production consumer
  should use it as a second dataflow authority.

## Upstream comparison

CodeQL separates dataflow configuration (sources, sinks, barriers, additional flow steps)
from the dataflow engine/query surface. This supports keeping RouteSync policy downstream of
`DataFlowInterface`.

LLVM's analysis manager similarly centralizes analysis computation/results and lets consumers
query the appropriate analysis rather than each consumer recomputing it.

## Concrete change

Before:

`ServiceGraphBuilderInterface extends DataFlowProjectionInterface<RouteSyncManifestFlow, ServiceGraph>`

This incorrectly labeled a non-dataflow graph input as a dataflow projection.

After:

`ServiceGraphBuilderInterface extends InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>`

Only IR retains the `DataFlowProjectionInterface` specialization because its upstream input
is genuinely `DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>`.
