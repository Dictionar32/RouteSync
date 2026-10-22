# Phase 2327 — Existing authorization authority and Laravel scanner trace

## Scope

This phase evolves the existing `LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface` implementation and its existing test. It does not introduce a second authority, a generic wrapper, a V2 interface, or a replacement scanner.

## Traced route

`CLI scan/sync` → manifest/source pipeline → `LaravelRouteScannerInterface.scan` → `scanRoutes` → `emitDeclaration` → `authorizationAuthority.judge(route-declaration middleware)` → existing route emitter → route boundary/producer → `LaravelRouteScanArtifact`.

The scanner contract injects the method authority and authorization authority. The authority is not constructed inside the emitter. The judgment currently narrows the route declaration's middleware evidence and the downstream emitter projects the judgment to its existing boolean `isAuth` input. That projection is lossy: the emitted `auth` value does not preserve the full judgment or explain which middleware supplied evidence.

## Contract findings

1. `LaravelRouteAuthorizationSemanticJudgment` is already a closed discriminated union (`present` / `absent`) and should be evolved in place, not duplicated.
2. Its current input is the middleware explicitly observed on the route declaration. It is not, by itself, proof of the complete effective Laravel middleware stack. Laravel supports middleware attached to routes and controllers, including method-specific and resource-controller middleware; the current scanner must not imply it has resolved all those sources.
3. `LaravelRouteScannerInterface` is the upstream wiring authority. The CLI path should continue to use this interface, not create a parallel CLI-only authority.
4. The scanner still imports route-emission/projection helpers from `subscanners`. This means the subscanner migration is incomplete; deleting that path before migrating those contracts and tracing CLI would break the path rather than make the runtime executor purer.
5. `routeMiddlewareFlowResolver.ts` is the existing home for scope/exclusion resolution, but it imports `semantic/relations`. Do not wire it into this authorization authority until its input is demonstrably the complete route + group + controller middleware evidence and its relation dependencies have been migrated to their proper upstream owner. A raw middleware list must not be wrapped and mislabeled as an effective flow.

## Fix in this phase

The existing authority accepted `auth:` as authentication middleware even though it has no guard identifier. Tighten the existing predicate so `auth:<guard>` requires a non-empty guard name. Keep exact aliases and fully-qualified built-in middleware matching unchanged. Add a regression test for the empty guard.

## Next contract-level correction

Evolve the existing judgment and scanner artifact contracts in place so a route artifact can preserve the closed authorization judgment instead of immediately reducing it to `boolean`. Do this only alongside an end-to-end trace of all `RouteEmission` consumers and manifest projection. Keep the distinction between declaration evidence and fully resolved effective middleware explicit. Do not infer controller/group middleware from the route declaration alone.

## Verification boundary

The added regression assertion is source-level coverage. This phase does not claim that Vitest, TypeScript build, or the complete CLI integration suite was executed in this environment.
