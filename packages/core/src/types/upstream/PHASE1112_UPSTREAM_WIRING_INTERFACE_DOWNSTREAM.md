# Phase 1112 — Upstream → Wiring → Interface → Downstream trace repair

Baseline: complete `/tmp/routesync1111` workspace, carrying the complete upstream/domain tree and Phase 1111 wiring.

## Canonical direction

```text
Laravel source
  -> scanner/parser
  -> types/upstream semantic vocabulary + authority
  -> compiler/scanner/wiring
  -> InterfaceDependencyBoundary / DataFlowInterface
  -> graph / dataflow / IR
  -> CLI package surface
```

## Repairs

- Removed remaining production/test imports targeting the retired `compiler/scanner/upstream` lane.
- `sourceAstScanner` now consumes the migration adapter from `scanner/wiring`.
- route-group semantic descriptor compatibility now delegates to the wiring resolver.
- stale route-AST construction tests now verify the canonical `RouteProducer` instead of a removed `routeAstConstructor`.
- implemented the downstream `SemanticDataflowDataFlowAdapter` over the generic `DataFlowInterface`.
- implemented `semanticDataflowRuntimeBoundary` as the concrete `InterfaceDependencyBoundary` composition.
- CLI scan/sync now pass the concrete runtime boundary explicitly; the CLI facade only re-exports the core implementation.
- IR continues to project `dataflow.state.closure`; it does not derive closure.
- graph continues to project `RouteSyncManifestFlow` through its downstream boundary.

## Generic contracts

`DataFlowInterface<Input, State, Node>` remains domain-neutral. Domain source/sink/barrier policy remains in analysis policy configuration.

`InterfaceDependencyBoundary<Upstream, Downstream>` remains downstream-owned and directional; upstream types do not import or implement it.

## Semantic evidence retained

The ecommerce fixture remains the E2E semantic oracle for route, controller/request, model relation, resource, and schema/foreign-key evidence.

## Remaining separate frontier

There are 38 production `types/domain` files importing compiler modules. This is not an upstream boundary violation because `types/domain` is a distinct materialization/domain lane, but it remains a future migration frontier if the goal is to make all semantic domain vocabulary compiler-independent.
