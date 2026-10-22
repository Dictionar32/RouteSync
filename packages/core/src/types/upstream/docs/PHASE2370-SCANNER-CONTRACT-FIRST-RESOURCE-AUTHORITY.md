# Phase 2370 — Scanner Contract-First Resource Authority

## Why this phase starts at the scanner contract

Phase2369 evolved the action plan consumed by the emitter but left `laravelRouteScanner.ts` constructing `resourceName` and `RouteResourceRegistration` before calling `RouteResourceFlowAuthority.resolve`. The authority therefore received semantic products prepared by its consumer.

## Existing contract evolution

`LaravelRouteScannerInterface` advances to contract version 27 while retaining the existing `routeResourceFlowAuthority` ownership. The existing `RouteResourceFlowAuthority` advances to contract version 3 and adds `resolveDeclaration`, whose input is the closed `RouteResourceDeclarationInput` over `RouteResourceDeclarationEvidence`. This does not introduce a parallel scanner or a second resource authority.

The evidence includes the source path, group prefix, a closed action-filter variant (`unfiltered | only | except`), and source modifiers. It intentionally does not contain a precomputed `ResourceName` or `RouteResourceRegistration`.

The authority now derives the resource identity and canonical registration from that evidence, then delegates to the existing route resource judgment resolver. The scanner projects syntax facts into the evidence contract and calls `resolveDeclaration`; it no longer invokes `resourceRegistrationFromDeclaration` or derives the resource identity itself.

## Changed files

- `packages/core/src/types/upstream/laravelRouteScannerInterface.ts` — evolved the existing scanner interface contract version.
- `packages/core/src/types/upstream/routeResourceFlow.ts` — evolved the existing authority contract, added declaration evidence/input types, and implemented declaration-level resolution.
- `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts` — resource branch now calls the declaration-level authority operation.
- `scripts/audits/audit-phase2370-scanner-contract-first-resource-authority.cjs` — added a focused contract/wiring audit.
- Existing Phase2366/2367 audits were updated to assert the evolved contract instead of requiring the previous partial `resolve` call.

## Verification

The Phase2370 focused static audit passed 11/11 checks; the updated Phase2366 audit passed 12/12 and the updated Phase2367 audit passed 8/8. TypeScript validation is blocked by the repository's unsupported target/lib options under the available TypeScript 5.8.3 and pre-existing syntax errors in `effectiveControllerActionPolicyResolver.phase921.test.ts`. No build command is run. CLI end-to-end is not yet verified.

## Explicitly unfinished

This phase does not claim the full mission is complete. The active scanner still uses `subscanners/route-scanner` for emission and standard-route path resolution, still imports `semantic/relations`, and still computes controller/action projections before resource authority execution. The producer boundary and full CLI output contract remain to be traced and evolved in later work.
