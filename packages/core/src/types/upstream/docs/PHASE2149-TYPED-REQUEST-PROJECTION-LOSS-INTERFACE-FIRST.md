# Phase 2149 — Typed Request Projection Loss: Interface-First Trace

## Finding

Phase 2148 established source-owned controller request classification, but did not close its route-level consumer. The trace shows two parallel paths:

1. `ControllerMethodAst.parameters → LaravelControllerRequestSemanticBindingAuthorityInterface.judge → LaravelControllerActionSemanticKnowledge.request`
2. `scanControllerAction → ControllerActionContract.request → routeProducerRelations → RouteRequestBinding / EndpointRequestBinding`

The second path still reads `value.action.request.kind` from the legacy action projection. In `routeProducerRelations.ts`, only `form_request` and `framework_request` survive; the final branch returns `no_request`. Therefore a canonical `typed` or `typed_unresolved` outcome cannot be safely projected to the route binding today.

## Contract improvement

The existing `LaravelControllerActionSemanticJudgmentContract` now explicitly publishes `typed_request_binding_projection_loss` with:

- current owner: `route_producer_relations`
- target owner: `upstream_route_request_binding_authority`

The contract version advances from 17 to 18. This is deliberately an explicit open obligation, not a claim that the route behavior is fixed.

## Next implementation boundary

Before changing route ADTs, trace every consumer of `RouteRequestBinding` and `EndpointRequestBinding`. Then evolve the existing upstream route request-binding contract so `typed` and `typed_unresolved` remain distinct end-to-end. The downstream request-type solver must treat unresolved binding as a blocked judgment, not as `no_request`. Wire the canonical action judgment into that existing boundary; do not add `relation/foundation`, a new subscanner, or a duplicate authority.

## Unchanged guarantees

- Invocation judgment remains correlated with the action judgment.
- Integrated response ownership remains with the existing controller-wide response pipeline.
- Runtime executor forwards the completed judgment and does not perform semantic classification.
- Legacy `scanControllerAction` / `resolveControllerActionContract` remains an open derivation boundary.
