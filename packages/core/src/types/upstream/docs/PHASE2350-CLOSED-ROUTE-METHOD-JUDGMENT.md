# Phase 2350 — Closed Route Method Judgment

## Root cause

The canonical scanner already used `LaravelRouteDeclarationMethodJudgmentAuthority`, but its result only distinguished resource from standard methods. `routeProducerInputFromRouteBoundary` then independently called `routeMethodSemanticKind(declaration.method)` to distinguish `any`, `match`, and ordinary HTTP methods. This duplicated semantic classification downstream and meant the upstream judgment was not complete enough for the producer projection.

A second defect existed in the HTTP-method projection table: an unknown lookup silently became `GET`. The route producer therefore had a fallback that could misrepresent a method rather than consume a total, typed mapping.

## Existing contracts evolved

- Extended the existing `LaravelRouteDeclarationMethodJudgment` ADT with explicit `laravel_route_declaration_method_all_methods` and `laravel_route_declaration_method_match` variants.
- Tightened `LaravelStandardRouteMethod` so `any`, `match`, and resource declarations cannot inhabit the standard arm.
- Versioned the existing method authority contract as version 2.
- Advanced the existing `LaravelRouteScannerInterface` and its scan judgments from contract version 17 to 18.
- Routed the exact method judgment produced by `declarationMethodAuthority.judge` through scanner acquisition to `routeProducerInputFromRouteBoundary`.
- Replaced the producer's HTTP-method tuple lookup with a total `Readonly<Record<HttpMethod, RouteMethod>>` projection. There is no silent `GET` fallback in this canonical projection.

## Canonical path

`LaravelRouteScannerInterface.declarationMethodAuthority` → `LaravelRouteDeclarationMethodJudgment` → `emitDeclaration` / route emission association → `routeProducerInputFromRouteBoundary(methodJudgment)` → `RouteProducerInput.identity.method` → `routeProducer.produce`.

The runtime projection now consumes the already-closed judgment instead of reclassifying `any`/`match`/standard method semantics. The authority remains the single owner of that distinction.

## Scope and validation

- Added a regression test for `any`, `match`, a standard method, and a resource method.
- Added `scripts/audits/audit-phase2350-closed-route-method-judgment.cjs`.
- No new authority, V2 interface, or `semantic/foundation` dependency was introduced.
- This phase does not claim that the whole scanner path is free of `semantic/relations`. `routeProducerRelations.ts`, the route emitter helpers, and the retained legacy `RouteScanner.ts` still contain relation imports and remain separate migration work.
- Static audits and ZIP integrity are checked; TypeScript type-check, Vitest, CLI end-to-end, and build are not claimed. `npm run build` is intentionally not run.
