# RouteSync Phase 2408 — Resource Route Empty Controller Map Retirement

## Production change

The active resource-route emitter previously accepted a nested `RelationIndex<string, RelationIndex<string, ControllerActionInfo>>` controller map, but the only production call site always supplied `relationNone()`. That made the emitter's `controller_action` branch unreachable on the active resource route path and retained an unused compiler-projection dependency plus map lookup machinery.

This phase removes that unreachable parameter and lookup from the existing emitter. Resource targets now follow the actually wired input: a known controller becomes `controller_reference`; a declaration without a controller becomes `closure`. The existing `actionJudgmentForTarget(...)` callback still correlates the route target against the canonical action judgment publications, and `routeBoundaryContractFromRouteFacts(...)` still derives request binding from that judgment.

## What this does and does not close

**Closed by this change:** the resource route emitter no longer pretends an absent controller map can supply `ControllerActionInfo`; its public operation matches the real active producer input. The dead `RelationIndex` lookup and direct `ControllerActionInfo` map dependency are removed from that operation.

**Still open:** this is not the complete route-facing action projection. The route target continues to carry the existing unresolved `ResponseDescriptor` on the controller-reference branch, and the active resource path does not yet consume a complete projection correlated with the integrated response judgment. The upstream response pipeline still identifies `resolved_response_attribute_descriptor` as missing coverage. No claim is made that route response semantics or end-to-end interface-first closure is complete.

## Authority boundaries preserved

- Invocation semantic judgment remains the source-correlated invocation authority.
- `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` remains the integrated HTTP response authority.
- Route/action correlation continues to use the existing `controllerActionRouteCorrelationAuthority`.
- No duplicate semantic authority, new generic resolver, `semantic/foundation` dependency, or new `semantic/relations` dependency was added.

## Validation boundary

The Phase2408 audit checks that the production signature and recursive call no longer carry the empty map, that the route scanner no longer passes `relationNone()` as the map argument, and that canonical action correlation remains connected. It is a structural audit only. TypeScript typecheck, package build, Vitest, and live scan/sync CLI were not run.
