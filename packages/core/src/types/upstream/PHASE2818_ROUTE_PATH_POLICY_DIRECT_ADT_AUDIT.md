# Phase 2818 — Route Path Policy Direct ADT Audit

## Root cause

Phase 2817 removed relation utility calls from the acceptance continuation, but the route-path fact factory still selected its expectation through `catalogRequired` → `catalogLookup` → `relationOptionFold` / `relationFirst`. That meant the route-path runtime still depended indirectly on the same generic relation utilities. Renaming the output shape to an ADT did not remove that dependency.

## Change

- Removed `RoutePathTokenPolicy` and `ROUTE_PATH_TOKEN_POLICIES`.
- Added a route-path-specific closed switch, `routePathTokenExpectation(method)`, using the existing upstream `LaravelRouteMethod` union.
- Fact construction now obtains the expectation directly from that domain switch; it does not call generic catalog or relation helpers.
- The existing `RoutePathTokenFact.continueForAcceptance` remains the domain operation that applies the expectation to actual token evidence.
- The factory and acceptance entry point remain interface-first frozen runtime objects.
- `routeDeclarationParser` continues to call `routePathTokenAcceptanceOperation.accepts`.
- No new upstream contract was introduced: the existing route method evidence contract is reused.
- `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Runtime trace

`CLI scan/sync → RouteSyncCliManifestScanOperationInterface.scan → controller manifest composition → LaravelSourceAstPipelineInterface.execute → route declaration parser → routePathTokenAcceptanceOperation.accepts → routePathTokenFactFactory.create → routePathTokenExpectation (closed switch) → RoutePathTokenFact.continueForAcceptance → route AST/semantic projection → manifest projection`.

## Scope boundary

This phase removes the indirect relation-catalog dependency from the route-path fact/acceptance path only. Other parts of `semanticRouteSyntaxRelations.ts` still use relation utilities for separate responsibilities (for example catalog lookup, constraints, and group operations); this audit does not claim global removal. Those call sites require separate domain-by-domain migration and proof.

## Upstream recommendation

Reuse the existing `LaravelRouteMethod` contract exported from `packages/core/src/types/upstream/laravelRouteScannerInterface.ts` (backed by `routeDeclarationEvidence.ts`). Keep the route-path expectation local unless another runtime consumer establishes a concrete shared domain responsibility. Do not introduce a generic reasoning primitive or a parallel method contract. For any next upstream ADT, require both a closed domain shape and a domain operation that acts on its result.

## Verification boundaries

The Phase 2818 audit verifies the closed switch, absence of the policy catalog and relation utility calls from the targeted path, interface-first exports, parser integration, existing upstream contract reuse, trace documentation, and the zero-byte collections invariant. It does not establish full typecheck, production build, full test-suite, or CLI end-to-end correctness.
