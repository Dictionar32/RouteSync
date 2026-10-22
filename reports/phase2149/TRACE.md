# Phase 2149 Trace — Request Binding Projection Loss

## Source-to-route trace

`ControllerMethodAst.parameters`
→ `canonicalRequestBinding(...)`
→ `LaravelControllerRequestSemanticBindingAuthorityInterface.judge(evidence)`
→ `LaravelControllerActionSemanticKnowledge.request` (`no_request | form_request | framework_request | typed | typed_unresolved`)

In parallel, route publication still flows through:

`scanControllerAction(...)`
→ `resolveControllerActionContract(...)`
→ legacy `ControllerActionContract.request`
→ `routeProducerRelations.ts`
→ `RouteRequestBinding`
→ `EndpointRequestBinding`

The route projection in `routeProducerRelations.ts` maps FormRequest and framework Request explicitly, then defaults to `no_request`. That fallback is semantically lossy for typed and unresolved request outcomes.

## Scope of this phase

This phase strengthens the existing upstream judgment contract and names the exact unresolved ownership boundary. It does **not** change runtime request behavior, because safely doing so requires a closed route-level ADT and consumer updates across request derivation and capability projection. The issue remains open by design.
