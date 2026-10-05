# Phase 927 — Route Policy Evidence Projection

Phase 927 closes the next upstream Laravel policy boundary without turning policy into generic dataflow or service-graph edges.

## Route evidence

Routes whose canonical target is a concrete `controller_action` now project their already-resolved route middleware into `ControllerActionPolicyRelation`.

The projection preserves `RouteMiddlewareSource` provenance:

- `route_group` remains route-group evidence.
- `route` remains direct route evidence.
- controller/resource provenance remains available when those sources are already represented by the canonical route middleware contract.

The route projection does not synthesize `EffectiveControllerActionPolicy`; it only moves existing canonical evidence into the policy relation lane. This avoids claiming cross-route/controller closure that has not been resolved.

## Boundary

```text
RouteDefinition.capability.middleware
  -> ControllerActionPolicyRelation
  -> SemanticRelationGraph
  -> policy analysis
```

The route policy relation is rejected by the structural graph-edge projection and is never represented as `SemanticDataflowFact`.

## Laravel alignment

Laravel route groups merge middleware into nested routes, while controller middleware can be scoped with `only`/`except`; resource controllers additionally support action-specific middleware. These distinctions are preserved as provenance rather than flattened into one generic dataflow fact.

## Regression boundary

Neither `examples/ecomerce-shop-source` nor `examples/ecommerce-shop-source` exists in the current workspace. Existing inline e-commerce regression sources remain authoritative; no synthetic fixture is created.
