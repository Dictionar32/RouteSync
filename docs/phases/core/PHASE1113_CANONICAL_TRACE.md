# Phase 1113 — Canonical upstream → wiring → interface → downstream trace

The canonical production direction is:

`Laravel evidence → types/upstream → compiler/scanner/wiring → generic interface → graph / dataflow / IR / CLI`

## Ownership

- `types/upstream` owns semantic vocabulary and semantic authority.
- `compiler/scanner/wiring` owns Laravel-specific adaptation and construction.
- `DataFlowInterface` is generic execution/state/query capability; Laravel source/sink/barrier policy stays outside it.
- `InterfaceDependencyBoundary<Upstream, Downstream>` is downstream-owned.
- Graph consumes `RouteSyncManifestFlow` through a projection boundary.
- IR consumes canonical `DataFlowInterface.state` through `DataFlowProjectionInterface` and does not recompute closure.
- CLI consumes the package surface and supplies the runtime boundary.
- `StaticLaravelScanner` and the former `compiler/scanner/upstream` implementation lane are retired.

## E-commerce evidence

The audit traces route → controller → model relation → resource → schema evidence in `examples/ecommerce-shop-source`.

## Explicit remaining frontier

There are exactly 28 production files under `types/domain` that still import compiler modules. They are intentionally recorded as the next semantic-type/domain decoupling frontier; this phase does not pretend that frontier is closed.
