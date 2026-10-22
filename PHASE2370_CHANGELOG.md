# Phase2370 — Scanner Contract-First Resource Authority

## Scope

This phase starts at the existing `LaravelRouteScannerInterface` and evolves the existing `RouteResourceFlowAuthority`. It does not claim the full Laravel scanner → emitter → producer → CLI chain is complete.

## Changes

- `LaravelRouteScannerInterface` contract version advances from 26 to 27.
- `RouteResourceFlowAuthority` contract version advances from 2 to 3 and adds `resolveDeclaration`.
- Added `RouteResourceDeclarationEvidence` and `RouteResourceDeclarationInput` as the typed source-evidence input for declaration-level resource resolution.
- The authority derives `ResourceName` and `RouteResourceRegistration` from declaration evidence before producing the existing `RouteResourceFlowJudgment`.
- Active scanner resource branch no longer derives resource identity or calls `resourceRegistrationFromDeclaration` before authority execution.
- Exported the new evidence/input types from the core public type surface.
- Updated Phase2366/2367 static audits to reflect the evolved contract, and added the Phase2370 focused audit.

## Validation actually run

- Phase2370 focused static audit: 11/11 passed.
- Phase2366 resource-flow authority audit (updated for current contract): 12/12 passed.
- Phase2367 resource plan/path audit (updated for current contract): 8/8 passed.
- TypeScript 5.8.3 focused check attempted with `target=esnext`; it reports existing dependency-graph errors in unrelated files and existing errors in `laravelRouteScanner.ts`. No new diagnostics were reported in `routeResourceFlow.ts` or `laravelRouteScannerInterface.ts`. Node type declarations are missing.
- Full configured type-check is blocked by repository `target`/`lib` options unsupported by TypeScript 5.8.3 and syntax errors in `effectiveControllerActionPolicyResolver.phase921.test.ts`.
- `npm run build` was not run.
- CLI end-to-end was not run.

## Remaining work

- Scanner still imports `semantic/relations` and `subscanners/route-scanner` for route emission and standard-route path handling.
- `routeDeclarationFlow`, controller/action projections, and target construction still run in scanner code.
- `RouteEmission` and `RouteBoundaryContract` projection still need a full ownership/contract trace.
- Producer and CLI output contract have not been verified end-to-end.

The phase is a real upstream contract improvement, not completion of the entire interface-first mission.
