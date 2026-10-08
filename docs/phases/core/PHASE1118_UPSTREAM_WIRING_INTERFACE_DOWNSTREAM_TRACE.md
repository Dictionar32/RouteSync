# Phase 1118 — Upstream → Wiring → Interface → Downstream Trace

## Canonical direction

```text
source / parser evidence
  -> types/upstream
  -> types/domain semantic vocabulary
  -> compiler/scanner/wiring lowering/adapters
  -> generic interfaces
  -> graph / dataflow / IR projections
  -> CLI package surface
```

## Verified boundaries

- `types/upstream/typeVocabulary.ts` is the canonical `TypeExpression` vocabulary.
- `types/upstream/manifest.ts` owns manifest and manifest-flow semantic surfaces.
- Route/controller/model-relation/resource/schema facts and relations remain upstream semantic evidence.
- `types/domain/semanticType.ts` owns canonical resolved semantic types.
- `DataFlowInterface<Input, State, Node>` remains generic; Laravel-specific source/sink/barrier/policy semantics belong to analysis configuration/wiring.
- `InterfaceDependencyBoundary<Upstream, Downstream>` remains directional and generic; upstream does not implement the downstream boundary.
- Graph and IR consume upstream/dataflow surfaces and do not become semantic authorities.
- CLI commands consume the `@routesync/core` package surface rather than `core/src` internals.
- `StaticLaravelScanner` and `compiler/scanner/upstream` have no production references.

## Phase 1118 repair

Historical domain tests under `types/domain/__tests__` still imported compiler semantic facades. Those tests now use the canonical domain semantic vocabulary. The stale model-boundary test no longer invokes the removed compiler scanner implementation; it verifies canonical schema evidence and model-key normalization directly.

Production source already had zero upstream/domain compiler imports; this phase closes the corresponding test-layer architectural drift and adds an explicit audit for the whole upstream/wiring/interface/downstream direction.

## Ecommerce oracle

`examples/ecommerce-shop-source` remains the E2E fixture for route, controller, model/relation, resource, and schema evidence.
