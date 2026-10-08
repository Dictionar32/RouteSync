# Phase 924 — Semantic Relation Boundary

Phase 924 separates structural semantic relations from Laravel controller-action policy relations before graph-edge materialization and generic dataflow.

## Authority

`StructuralSemanticRelation` is the only upstream relation lane eligible for structural graph-edge projection. `ControllerActionPolicyRelation` remains domain policy semantics and is explicitly excluded from the `GraphEdgeRelation` lane.

`isControllerActionPolicyRelation` and `isStructuralSemanticRelation` provide the closed type-level boundary. Upstream does not import graph implementation types.

## Policy provenance

`ControllerActionPolicyRelation` now retains:

- policy provenance (`route_group`, `route`, `controller_class`, `controller_method`, `resource`);
- `inheritedFrom` controller provenance.

This preserves Laravel action policy origin without encoding policy as a dataflow fact.

## Laravel alignment

Laravel 13 permits controller and method middleware, `only`/`except`, `WithoutMiddleware`, resource middleware, and `Authorize`. These remain policy semantics until an analysis explicitly consumes them.

## Dataflow boundary

No `dataflow_middleware`, `dataflow_authorization`, or `dataflow_policy` variants are introduced. Generic dataflow begins only after semantic values/relations have been normalized.

## E-commerce fixture

Neither `examples/ecomerce-shop-source` nor `examples/ecommerce-shop-source` exists in the workspace. Inline e-commerce regression sources remain the authoritative regression corpus; path strings in those tests are provenance identifiers, not physical fixtures.
