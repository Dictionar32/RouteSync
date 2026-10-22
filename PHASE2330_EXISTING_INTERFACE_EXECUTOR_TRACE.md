# Phase 2330 — Existing Interface / ADT / Runtime Executor Trace

## Scope
Audit the existing authorization and route-security contracts from Phase 2329. No parallel interface, V2 contract, generic wrapper, or new semantic owner is introduced.

## Existing contract chain

`LaravelRouteScannerInterface.authorizationAuthority` → `LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface.judge` → `LaravelRouteAuthorizationSemanticJudgment` → `RouteEmission` → route AST projection / manifest consumer.

A separate existing upstream path is:

`RouteSecurityAuthorityInput` → `RouteSecurityAuthorityAlgebraInterface.resolve` → `RouteSecurityJudgment` → route security/capability consumers.

## Findings

1. `LaravelRouteAuthorizationSemanticJudgment` is a closed discriminated union with `present` and `absent` variants. It should remain the canonical authorization-evidence judgment; do not create another authorization ADT.
2. `RouteSecurityJudgment` is a different, broader contract: it carries security descriptor, auth truth value, policies and rate-limit. It must not be substituted for the narrower middleware-evidence judgment without preserving the semantic distinction.
3. `RouteEmission.auth: boolean` is a lossy boundary. `emitDeclaration` reduces `authorization.kind` to `isAuth`, and the emitter persists that boolean. This discards the recognized middleware evidence and judgment discriminant.
4. `LaravelRouteScanArtifact` currently preserves AST, semantic flow and controller binding, but does not retain authorization judgment. Adding it safely requires tracing every `RouteEmission` producer/consumer, route AST projection and manifest contract; merely changing one parameter would strand evidence or force downstream reconstruction.
5. The scanner wiring still imports `RouteEmission` and emitter functions from `subscanners/route-scanner`. Subscanner removal is not established by the current trace. Do not claim it is removed until CLI reachability and all consumers have been migrated.
6. `routeSecurityAuthority.ts` still imports `semantic/relations` and `semantic/relations/relationalSequence`. This violates the desired no-relations migration boundary; replacing these imports mechanically would relocate control flow, not improve the contract. It needs a dedicated migration to the correct existing upstream ADT/operations owner.
7. Laravel supports middleware on routes and controllers, and action-specific `only` / `except` behavior. Therefore declaration-only route middleware is not enough to claim effective middleware for every controller action.

## Recommended next implementation boundary

Evolve the existing `RouteEmission` contract to preserve `LaravelRouteAuthorizationSemanticJudgment` while tracing all consumers. Then make the existing `LaravelRouteScanArtifact` carry the judgment only if the artifact is indeed the public semantic hand-off used by the CLI/manifest path. Keep `RouteSecurityJudgment` distinct because it represents broader resolved security policy. Resolve effective middleware from the existing `RouteMiddlewareFlow` contract only after route, group, controller, action scope and exclusions have all been correlated.

## Verification status

This phase is an architecture trace/report over the Phase 2329 source tree. ZIP integrity is checked. Vitest, TypeScript build and CLI integration were not run. No claim is made that the boolean hand-off, subscanner path, or `semantic/relations` imports are fixed in this phase.
