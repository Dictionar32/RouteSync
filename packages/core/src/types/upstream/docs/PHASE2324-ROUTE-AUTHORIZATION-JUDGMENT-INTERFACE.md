# Phase 2324 — Route Authorization Judgment Interface

## Finding

The route scanner derived its `isAuth` flag directly from middleware names through `routeAuthorizationKnowledge`. This made authorization meaning a hidden semantic decision inside the route emission path, even though the route scanner already exposed an upstream interface-first boundary.

## Contract and wiring change

- Added `routeAuthorizationSemanticJudgmentInterface.ts` in `types/upstream`.
- The contract defines a closed ADT: `laravel_route_authorization_middleware_present` or `laravel_route_authorization_middleware_absent`. Both variants preserve the exact matching middleware evidence.
- `LaravelRouteScannerInterface` now exposes `authorizationAuthority`; scanner contract and scan judgments advance to contract version 8.
- The existing middleware knowledge catalog now implements the upstream authority contract. The route scanner consumes its judgment rather than the old `authorized` / `unauthorized` local vocabulary.
- Existing route-scanner and route-context consumers were updated to consume the same canonical judgment.
- No imports from `semantic/foundation` or `semantic/relations` were added to the upstream contract.

## Production trace

`CLI scan/sync → upstreamManifestBuilder → laravelSourceAstPipeline → LaravelRouteScannerInterface → authorizationAuthority.judge(middleware evidence) → route emission → route AST projection → manifest builder`.

The authority is explicit in the scanner interface and wired to the existing semantic catalog. This phase does not claim the catalog is relation-free, nor that all route semantic derivations have moved upstream.

## Remaining debt

`laravelRouteScanner.ts` still derives controller/action target adaptation, resolves HTTP method strings, reads route files, projects route ASTs, and imports `semantic/relations`. The route middleware authority is now contract-visible, but full runtime-executor purity remains incomplete. The next meaningful boundary is source-correlated route target judgment, using the existing route declaration AST and controller/action correlation contracts rather than creating another generic callable wrapper.
