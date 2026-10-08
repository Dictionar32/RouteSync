# Phase 929 — Route Policy Closure Guard

Phase 929 closes a semantic guard gap discovered after the Phase 928 trace.

## Fixes

- `isRouteActionPolicyRelation` now recognizes both middleware and authorization route-action policy relations.
- `sourceModelReferenceIndexFromCatalog` prefers a supplied closed `EffectiveControllerActionPolicy` for the matching concrete controller/action before reconstructing fallback policy from the catalog.
- Route identity remains attached to every projected policy relation.
- Policy relations remain outside `StructuralSemanticRelation` and therefore cannot become `GraphEdgeRelation` edges.
- No `dataflow_middleware`, `dataflow_authorization`, or `dataflow_policy` vocabulary is introduced.

## Laravel boundary

Laravel route groups contribute middleware to concrete routes; controller middleware may be action-scoped; resource controllers support `middlewareFor` and `withoutMiddlewareFor`. These are policy semantics and are resolved before generic value-flow analysis.

Resource middleware is deliberately not inferred from a `direct` route middleware entry. Its canonical resource declaration/exclusion evidence remains a separate upstream input until it can be attached to each concrete generated resource route without loss.

## Fixture boundary

`examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` are not physical workspace fixtures. Existing inline e-commerce regression sources remain authoritative.
