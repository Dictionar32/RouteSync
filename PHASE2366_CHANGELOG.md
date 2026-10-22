# Phase2366 — Resource Flow Authority Execution

## Root cause

The active CLI route path used `LaravelRouteScannerInterface.declarationMethodAuthority`, but resource-flow resolution was hidden inside `emitResourceRoutes(...)`. The existing upstream `RouteResourceFlowJudgment` already represented a closed action/path plan, yet the scanner contract did not expose the operation that produced it and the emitter resolved the judgment internally. This weakened the interface-first boundary: a runtime emitter both requested semantic resolution and executed the result.

## Changes

- Added `RouteResourceFlowAuthority` as the explicit typed operation contract for the existing `resolveRouteResourceFlowJudgment` operation.
- Evolved the existing `LaravelRouteScannerInterface` to own and inject `routeResourceFlowAuthority`; advanced its contract and scan judgments to version 26.
- Updated the active CLI scanner path to call the injected authority, then pass the resulting `RouteResourceFlowJudgment` to `emitResourceRoutesFromJudgment`.
- Made `emitResourceRoutesFromJudgment` execute the already-resolved plan without calling semantic resolution.
- Kept the old `emitResourceRoutes` entrypoint as a compatibility facade for the retained legacy scanner path; it resolves a judgment and delegates to the judgment executor.
- Exported the existing resource-flow operation contracts from the core barrel.
- Added a 12-check audit for authority ownership, actual injection, judgment-to-executor wiring, and compatibility behavior.

## Verification

- Phase2350–Phase2366 focused audits: 17 scripts passed.
- The 16 historical phase audits through Phase2365 plus Phase2366 contain 239 static checks in aggregate; the current focused scripts all passed.
- ZIP archive integrity was checked separately after packaging.
- TypeScript type-check, Vitest, producer tests, and end-to-end CLI execution were not run because this extracted repository has no `node_modules`. `npm run build` was not run.

## Explicitly unresolved

- `routeResourceFlow.ts` still imports `semantic/relations` helpers.
- The active scanner still imports the route emitter through `compiler/scanner/subscanners/route-scanner`.
- `resourceRegistrationFromDeclaration(...)` still constructs registration from the scanner AST before authority resolution.
- `emitDeclaration(...)` still resolves the declaration base path, obtains authorization, and dispatches route families; a complete upstream route-emission judgment has not been established.
- `emitResourceRoutesFromJudgment(...)` still calls `resolveRoutePath(...)` on each planned `RoutePath` to produce the scanner-specific `ResolvedRoutePath` fields (`resourceName`, parameters, runtime path, and constant key). This means the resource judgment is consumed, but the route path contract is not yet rich enough for a strictly mechanical emitter.
- The old compatibility `emitResourceRoutes(...)` path still invokes the resolver internally.

This phase closes the hidden resource-flow authority dependency on the canonical CLI path, but does not claim that the entire route scanner is a pure executor or that the architecture constraints are fully satisfied.
