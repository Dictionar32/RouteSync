# Phase 2353 — Closed Route Target-Method Vocabulary

## Finding

The existing `LaravelRouteDeclarationMethodJudgmentInput` and `RouteDeclarationAst` typed `targetMethods` as `LaravelRouteMethod[]`. That union includes declaration families (`match`, `any`, `resource`, `apiResource`, `singleton`, `apiSingleton`) that are not HTTP verbs. The parser could therefore represent a resource declaration or `Route::any()` as if its declaration-family name were a target HTTP method. The output judgment had already removed those redundant values, but the input and AST still admitted them.

## Contract evolution

- Added `LaravelRouteTargetMethod`, an alias of the existing closed `LaravelStandardRouteMethod` vocabulary; no parallel method catalog or V2 contract was introduced.
- Narrowed the existing judgment input, match/standard judgment arms, and route declaration AST `targetMethods` to that target-only vocabulary.
- Added `SyntaxRouteTargetMethod` and its own token catalog so `Route::match([...])` accepts only supported target HTTP verbs; it no longer reuses the broader declaration-family parser for target evidence.
- Changed the existing route-target resolver catalog so standard declarations carry their explicit target method, `match` parses target-method evidence, and `any`/resource declarations carry no synthetic target-method evidence.
- Advanced the method authority contract from 4 to 5 and route scanner/scan outcome contracts from 20 to 21. Updated prior phase audit expectations so the cumulative static audit chain remains runnable.

## Interface-first boundary

The upstream judgment and AST now express two different concepts with different closed types:

- declaration family: `LaravelRouteMethod`
- target HTTP method evidence: `LaravelRouteTargetMethod`

This prevents downstream route projection from receiving declaration-family names in a field that claims to contain HTTP verbs. The scanner remains an executor of the upstream method judgment rather than repairing invalid method evidence.

## Known source compatibility gap

Laravel 13 documents `Route::query()` as a route for the `QUERY` HTTP verb, including request-body semantics. RouteSync's current standard method/HTTP execution vocabularies do not yet include `query`/`QUERY`. This phase deliberately does not add a parser-only token: complete support must be traced through the upstream method ADT, target HTTP method vocabulary, route IR, request/runtime contracts, and generated clients. `RoutePayloadLocation.Query` means payload placement and is not equivalent to the `QUERY` HTTP verb.

Official references:
- Laravel 13 routing documentation: https://laravel.com/framework/docs/13.x/routing
- Laravel 13 router implementation: https://github.com/laravel/framework/blob/13.x/src/Illuminate/Routing/Router.php
- TypeScript discriminated unions and exhaustiveness: https://www.typescriptlang.org/docs/handbook/2/narrowing

## Verification

The phase audit checks the closed target-method contract, parser vocabulary, resolver semantics, contract-version synchronization, and no new `semantic/foundation` imports. Static checks do not replace TypeScript compilation, focused Vitest execution, CLI end-to-end verification, or a full build; those were not run. `npm run build` was intentionally not run.
