# Phase2415 — Route Response Blocker Propagation to Manifest Boundary

## Objective

Continue Phase2414 by preventing an unresolved route response projection from being published as a complete source-AST/manifest result. The existing route AST already carries `EndpointResponseBinding`; the remaining execution gap was that `LaravelRouteScanOutcome` had no response-blocked arm and `laravelSourceAstPipeline` only gated missing route files and blocked route policies.

## Production changes

1. Evolved `LaravelRouteScanOutcome` with `LaravelRouteScanResponseBlockedJudgment`.
2. After route AST production, the existing route scanner gathers every route whose canonical `ast.bindings.response` is `controller_response_projection_blocked`.
3. If any such response exists, the scanner returns the exact complete scan plus correlated route ASTs and their exact blocked response ADTs. Any policy blockers discovered in the same scan are retained too.
4. Evolved `LaravelSourceAstProjectionJudgment` with `laravel_source_ast_projection_route_response_blocked`, preserving the same invocation inventory receipt and exact route scan judgment.
5. `laravelSourceAstPipeline` returns this blocked judgment before resource/response AST production. Therefore the manifest builder cannot receive a complete source-AST judgment for unresolved route-response projections; its existing blocked-result contract carries the outcome onward.
6. Advanced route scanner and source-AST pipeline contract versions to 31/27 and 16 respectively; exported the new route-scan outcome type.

## Authority and behavior

- The controller response semantic pipeline remains the owner of Integrated Response meaning.
- `controllerActionRouteCorrelationAuthority` remains the owner of controller/action correlation.
- This change adds no semantic authority and does not reinterpret `ResponseResult`.
- The route scanner only transports the explicit blocker already present in the route AST into the existing closed scan outcome.
- A blocked response is not rewritten as `empty_response`, `declared_response`, or `void`.
- Existing manifest builder semantics already distinguish complete projection from all blocked projection judgments, so no parallel CLI-side heuristic was introduced.

## Remaining work

This phase closes the fail-closed propagation for *explicitly blocked* response projections. It does not finish the compatibility migration: the route boundary still carries `ResponseDescriptor`, and the scanner still seeds that legacy field with `VoidResponseDescriptor.create()` while canonical `EndpointResponseBinding` is the response product used by `RouteAst`. Valid method response products therefore still require the next phase to migrate the remaining descriptor/schema consumers to the canonical response contract without lossy conversion. Full typecheck, Vitest, package build, and live scan/sync CLI remain unverified in this environment.
