# Phase 945 — Current Upstream Provenance and Laravel Dataflow Boundary

## Canonical ownership

The canonical upstream semantic contract remains `packages/core/src/types/upstream`.
There is intentionally no `packages/core/src/upstream` namespace. Scanner-facing
producers and adapters remain under `packages/core/src/compiler/scanner/upstream`.

Production imports must not point from `types/upstream` back into `compiler/scanner`.

## Ecommerce provenance

The historical `examples/ecomerce-shop-source` and `examples/ecommerce-shop-source`
trees are not physical workspace authorities. Current regression evidence is
owned by `packages/sdk/tests/fixtures/ecommerce-shop-source`.

Historical phase documents may retain the old path as provenance, but current
architecture documentation must state that it is historical rather than claim it
as a checked-in source tree.

## Laravel policy lane

Laravel controller evidence such as `#[Middleware]`, `#[WithoutMiddleware]`, and
`#[Authorize]` enters the controller policy relation lane:

```text
controller evidence
  -> ControllerPolicyRelation
  -> EffectiveControllerActionPolicy
  -> ControllerActionPolicyRelation / RouteActionPolicyRelation
  -> CompleteLaravelSourceModel.relations
```

These policy relations remain semantic relations. They are not generic dataflow
facts and are not structural graph edges.

## Generic dataflow lane

The producer adapter emits only `dependency` and `value_flow` seed facts into
`SemanticDataflowInput`. `reaches` is derived by `astDataflowAuthority` through
least-fixed-point closure and is not accepted as a producer seed.

The two lanes intentionally meet only through explicitly typed upstream/source
model boundaries; Laravel policy names such as `middlewareFor` and
`withoutMiddlewareFor` must not become variants of `SemanticDataflowFact`.

## Verification

`audit:phase945-current-upstream-provenance` verifies the current ownership,
provenance, Laravel policy evidence, dataflow seed boundary, authority closure,
and structural graph projection boundary.
