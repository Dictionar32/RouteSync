# Phase 2354 — Route QUERY Judgment Wiring

## Root cause

The previous route-method judgment contract distinguished resource, `any`, `match`, and standard methods, but did not represent Laravel's `Route::query()` as its own semantic declaration. The lexical vocabulary, route target method vocabulary, HTTP execution vocabulary, and route method ADT also omitted `QUERY`. Treating `RoutePayloadLocation.Query` as equivalent would be semantically wrong: payload placement and the HTTP QUERY verb are separate concepts.

Laravel 13.35 documentation lists `Route::query($uri, $callback)` as a route responding to the QUERY HTTP verb and explains that it accepts a request body. The router implementation calls `addRoute('QUERY', ...)`.

## Changes

- Evolved the existing `LaravelRouteDeclarationMethodJudgment` with the closed `laravel_route_declaration_method_query` arm.
- Evolved the existing `LaravelRouteDeclarationMethodSemanticAuthority` to issue that judgment upstream, and advanced its contract version to 6.
- Added `query` to the existing Laravel route declaration/target method vocabularies and AST.
- Added `QUERY` to the existing HTTP method execution vocabulary, request method type, HTTP method registry, route method ADT, and route IR method vocabulary.
- Wired `laravelRouteScanner` to consume the query judgment and emit a route with `HttpMethod.QUERY`.
- Added QUERY to the `Route::any()` supported-method set, and allowed `Route::match(['QUERY'], ...)` to preserve the explicit target-method evidence.
- Advanced the Laravel route scanner and its scan judgments/outcomes to contract version 22.
- Added an upstream authority regression case and a static phase audit.

## Execution trace

`Route::query()` syntax catalog → `RouteDeclarationAst` → `LaravelRouteDeclarationMethodJudgmentAuthority.judge()` → `laravel_route_declaration_method_query` → `laravelRouteScanner.emitDeclaration()` → `RouteEmission` with `QUERY` → source AST pipeline → upstream manifest builder / CLI path.

The runtime scanner consumes the judgment; it does not infer query semantics from `RoutePayloadLocation.Query`.

## Verification

The static audit `scripts/audits/audit-phase2354-route-query-judgment-wiring.cjs` checks the upstream judgment, syntax and AST vocabulary, scanner consumption, source-AST pipeline, and manifest-builder path. It passed 20/20 checks in this workspace. The updated Phase 2350–2353 static audits also passed 60/60 checks in this workspace.

No TypeScript compiler, Vitest suite, CLI end-to-end fixture, or package build was run. `npm run build` was not run.

## Explicit incomplete boundary

This phase is **not a claim of full generated-client QUERY support**. The existing SDK executor in `packages/sdk/src/defineApi.ts` narrows HTTP methods to GET/POST/PUT/PATCH/DELETE and invokes `client[method]`; `HttpClient` does not yet expose a typed QUERY operation. Consequently, a generated SDK call for a QUERY route is not verified and must not be considered complete. The next phase must evolve the existing HTTP client operation contract and SDK executor without weakening method typing or introducing a semantic fallback.

The scanner/lexer path also retains pre-existing `semantic/relations` imports, and the legacy subscanner files remain in the repository. This phase adds no dependency on `core/src/semantic/foundation`, but does not claim to remove those existing relations or retire the legacy files.
