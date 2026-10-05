# Phase 921 — Effective Controller Action Policy Authority

Phase 921 closes the Laravel policy boundary above generic semantic dataflow.

## Authority

`EffectiveControllerActionPolicy` is the canonical semantic relation for one
concrete controller action. It combines the already-canonical middleware flow
with controller authorization and inheritance provenance.

```text
route/controller/resource policy evidence
        ↓
RouteMiddlewareSemanticInput
        ↓
resolveRouteMiddlewareFlow
        ↓
EffectiveControllerActionPolicy
        ↓
semantic graph
        ↓
SemanticDataflowIdentity
        ↓
least-fixed-point closure
```

## Deliberate separation

Middleware and authorization remain Laravel domain semantics. They are not new
`SemanticDataflowFact` variants. Generic dataflow continues to model dependency,
value flow, and reaches relations only after policy normalization.

## Laravel semantics covered

The boundary preserves action-scoped middleware, middleware exclusions,
controller inheritance provenance, and authorization relations. This matches
Laravel's controller middleware model, including `HasMiddleware`, `only` /
`except`, `WithoutMiddleware`, inherited class-level exclusions, resource
middleware, and `Authorize`.

## E-commerce fixture

`examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` are not
present in the checked-in workspace. Existing inline e-commerce regression tests
remain the regression corpus; no synthetic fixture is introduced.
