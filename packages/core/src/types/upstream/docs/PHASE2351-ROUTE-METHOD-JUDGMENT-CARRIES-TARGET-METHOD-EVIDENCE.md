# Phase 2351 — Route Method Judgment Carries Target-Method Evidence

## Root cause

Phase 2350 closed the route method-family ADT, but the judgment only carried the declaration family. The active scanner and producer still reread `RouteDeclarationAst.targetMethods` independently. That split the authority result from the exact parsed method evidence used by emission and `RouteProducerInput`.

## Change

- Evolved the existing `LaravelRouteDeclarationMethodJudgmentAuthority` input into `LaravelRouteDeclarationMethodJudgmentInput`, pairing the declared method family with the parsed target-method evidence.
- Evolved every arm of the existing `LaravelRouteDeclarationMethodJudgment` ADT to preserve `targetMethods`.
- Advanced the authority contract from version 2 to version 3 and the existing route scanner contract/judgments from version 18 to version 19.
- Updated the canonical scanner to use the judgment's `targetMethods` for standard and `match` emission, and to expand `any` to the supported HTTP-method set without trying to parse `any` as a single HTTP verb.
- Updated `routeProducerInputFromRouteBoundary` to consume `methodJudgment.targetMethods`, rather than rereading `declaration.targetMethods`.
- Updated the retained legacy caller to supply the same complete authority input. No second authority was added.

## Resulting path

`RouteDeclarationAst` → `LaravelRouteDeclarationMethodJudgmentAuthority.judge({ method, targetMethods })` → closed `LaravelRouteDeclarationMethodJudgment` → route emission / `RouteProducerInput` → canonical `RouteAst`.

The judgment now preserves the declaration family and its exact parsed method evidence as one value. The producer also reads target-method evidence only for the `match` arm; `any` is represented as `RouteMethod.kind = 'any'` and is no longer fed through the single-verb resolver. This closes the invalid `Route::any()` method-resolution path found during tracing. This closes the split-input boundary; it does not yet eliminate the remaining `semantic/relations` dependency from `routeProducerRelations.ts`, nor does it claim that the legacy `RouteScanner.ts` has been retired.

## Constraints and validation

No `semantic/foundation` import was introduced. No `LaravelRouteScannerV2` or duplicate authority was created. The focused audit checks contract propagation, producer consumption, regression coverage, and absence of foundation imports. Type-check, Vitest, and CLI end-to-end are not claimed unless separately run.
