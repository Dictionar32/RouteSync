# Phase 926 — Controller Policy Evidence Wiring

Phase 926 closes the missing upstream wiring identified after the structural graph projection boundary.

## Boundary

`ControllerAction` now carries two explicit semantic fields:

- `policy: Sequence<ControllerPolicyRelation>` — controller-declared middleware/authorization evidence.
- `inheritedFrom: readonly ControllerName[]` — controller inheritance provenance.

The controller scanner constructs the method contract once and passes its canonical policy sequence into the action. This prevents policy evidence from being left only on the scanner-side method contract.

## Relation projection

`controllerActionPolicyRelationsFromEvidence()` projects that evidence into the canonical `ControllerActionPolicyRelation` lane.

This projection deliberately does **not** call the effective-policy resolver and does not claim that route/group middleware has been closed over the action. Route middleware remains owned by the route capability contract until a cross-route effective-policy closure is available upstream.

## Graph/dataflow boundary

The resulting policy relations remain in `SemanticRelationGraph`, but `StructuralSemanticRelation -> GraphEdgeRelation` still rejects policy relations. Policy relations are therefore available for policy analysis without becoming service-graph edges or generic dataflow facts.

No `dataflow_middleware`, `dataflow_authorization`, or `dataflow_policy` vocabulary is introduced.

## Laravel alignment

Laravel supports middleware at route, controller class, controller method, and resource-controller levels, and authorization attributes such as `#[Authorize]`. These are policy/configuration semantics and should remain distinct from value-flow dataflow. citeturn0search7turn0search1

## Regression boundary

The repository still does not contain `examples/ecomerce-shop-source` or `examples/ecommerce-shop-source`. Existing e-commerce tests remain inline/source-contract regression surfaces; no synthetic fixture is added.
