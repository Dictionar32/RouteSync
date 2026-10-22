# Phase 2328 — Existing authorization contract, ADT, and executor trace

## Scope

This phase builds on the existing `LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface`, `LaravelRouteAuthorizationSemanticJudgment`, and `LaravelRouteScannerInterface`. It adds no V2 contract, no generic wrapper, and no alternate authority.

## Concrete correction

The existing authority already rejects `auth:` with no guard, but accepted `auth:   ` because it only checked the suffix length. The existing implementation now requires a non-empty guard after trimming whitespace, and the existing authority test file covers that case. It still preserves the original typed `MiddlewareName` evidence rather than normalizing or rewriting it.

## Existing CLI path

`CLI scan/sync` → upstream manifest/source pipeline → `LaravelRouteScannerInterface.scan` → `scanRoutes` → `emitDeclaration` → injected `authorizationAuthority.judge` → route emitter → route AST projection → `LaravelRouteScanArtifact`.

The interface remains the injection boundary; the authority is not created by the emitter. The current executor path still projects the closed judgment to `boolean isAuth`, which loses the judgment kind and the middleware evidence before constructing route emissions. This is a real semantic information-loss boundary, not a reason to create another authority.

## Existing contracts and ownership

- `LaravelRouteAuthorizationSemanticJudgment` is already a closed discriminated union (`present` / `absent`). Keep it as the owner of this judgment.
- `LaravelRouteAuthorizationSemanticJudgmentAuthorityInterface` is already the authority boundary. Its input currently describes middleware evidence from the route declaration; it must not be misrepresented as fully resolved effective middleware.
- `RouteMiddlewareSemanticInput`, `RouteMiddlewareFlow`, `RouteMiddlewareContract`, `RouteMiddlewareExclusionContract`, and `RouteMiddlewareScope` already model scoped middleware declarations and exclusions. These are the first contracts to inspect when connecting route/group/controller middleware semantics; do not add a parallel generic `AuthorizationContext`.
- `LaravelRouteScannerInterface` already injects `authorizationAuthority`; preserve and evolve this boundary instead of adding a second scanner interface.

## Runtime/executor finding

The current route emitter consumes `isAuth: boolean` and writes `auth: isAuth`. Therefore the emitted result cannot explain which middleware was recognized or distinguish evidence absent from an upstream judgment that might later be blocked/incomplete. The next safe contract change must trace `RouteEmission`, route AST projection, manifest output and all consumers together, then replace the boolean hand-off with the existing judgment type if those output contracts can preserve it. Do not change only the emitter signature: that would leave the authority evidence stranded upstream or force a downstream reconstruction.

## Duplicate path finding

The repository still has route authorization calls in both `compiler/scanner/wiring/laravelRouteScanner.ts` and `compiler/scanner/subscanners/RouteScanner.ts`, plus a use in `subscanners/route-scanner/routeContextTracker.ts`. This confirms the subscanner path has not yet been retired. Do not delete it until CLI reachability and exports/imports prove it is unused; first establish one authoritative path and migrate consumers.

## Scope limit

This phase does not claim to resolve effective middleware from route groups, controller middleware, resource action constraints, or exclusions. Laravel supports middleware at route and controller levels, including `only`/`except` and resource-action-specific middleware; the current route-declaration evidence alone does not prove the full effective policy.

## Verification status

- Static source edits and test case added.
- Vitest, TypeScript compilation, and CLI integration were not run in this environment.
