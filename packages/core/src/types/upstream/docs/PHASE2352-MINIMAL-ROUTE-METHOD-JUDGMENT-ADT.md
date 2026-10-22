# Phase 2352 — Minimal Route Method Judgment ADT

## Root cause

The Phase 2351 route-method judgment retained `targetMethods` on every ADT arm. That evidence is meaningful for `Route::match()` and standard route declarations, but it is redundant for `Route::any()` (whose emission uses the canonical supported-method set) and resource declarations (whose emission uses resource registration semantics). Keeping it on those arms made the supposedly closed judgment carry irrelevant data and encouraged consumers to treat all arms as if their evidence had the same meaning.

## Change

Evolved the existing `LaravelRouteDeclarationMethodJudgment` and its authority:

- `resource` judgment now carries only the resource method family.
- `any` judgment now carries only the all-method declaration kind.
- `match` retains parsed target-method evidence.
- `standard` retains target-method evidence.
- Authority contract advances from 3 to 4.
- Existing route scanner and scan outcome contract advances from 19 to 20; runtime scanner outcomes were synchronized. The same composition-root review also found and synchronized the existing attribute-scanner object version with `LaravelAttributeScannerInterface` at version 20.

No new authority or V2 contract was introduced. No `semantic/foundation` dependency was added. The existing `semantic/relations` dependency in `routeProducerRelations.ts` remains outstanding and is not claimed to be removed.

## Follow-up finding

The official Laravel 13 routing reference includes `Route::query()` among available router methods. RouteSync's current `LaravelRouteMethod`, syntax vocabulary, and HTTP-method target vocabulary do not yet include `query`. This phase does not add it because that requires a coordinated upstream AST/IR/runtime vocabulary decision, not a local scanner patch. Treat it as the next compatibility audit item.

## Validation

The phase audit verifies the contract arms, authority output, scanner consumption, contract versions, and regressions. This is static validation only. TypeScript type-check, Vitest, and CLI end-to-end were not run in this archive environment.
