# Phase 2332 — Preserve Existing Authorization Judgment Across Upstream Route Contracts

## Scope

This phase continues Phase 2331 by evolving existing contracts. It does not introduce a second authority, a generic wrapper, a V2 type, or a new semantic foundation.

## Trace

`CLI source pipeline` → existing `LaravelRouteScannerInterface.scan` → `LaravelRouteScanArtifact.authorization` → existing `RouteEmission.authorization` → `RouteBoundaryOptions.authorization` → `RouteBoundaryContract.authorization` → `RouteSemanticFlow.authorization`.

`laravelSourceAstPipeline.ts` still wires the canonical `laravelRouteScanner`. The old `subscanners/RouteScanner.ts` path remains in the repository; this phase does not assert it is dead or delete it. Reachability and export/import tracing are required before retirement.

## Changes

- Evolved the existing `RouteBoundaryOptions` and `ResolvedRouteBoundaryOptions` contracts to carry `LaravelRouteAuthorizationSemanticJudgment`.
- The existing boundary resolver forwards the judgment without reconstructing it from `auth: boolean`.
- The existing `RouteBoundaryContract` now retains the judgment.
- The existing `RouteSemanticFlow` retains the judgment, and the existing boundary-to-flow projection copies it directly.
- Advanced `LaravelRouteScannerInterface` / scan outcome contract version from 9 to 10 because the scanner artifact's `flow` contract now contains authorization judgment.
- Added a static audit with 10 assertions.

## Important boundary / not claimed

`auth: boolean` remains in `RouteEmission`, `RouteBoundaryOptions`, and the AST/capability projection as a transitional lossy projection. This phase preserves the stronger ADT beside it; it does not claim that the boolean has been removed or that generated manifest consumers now read the ADT. That is the next boundary to trace before changing manifest/IR contracts.

`routeProducerRelations.ts`, the current scanner wiring, and boundary resolvers still import `semantic/relations`. No `semantic/foundation` import was added, but the existing `semantic/relations` dependency has not been migrated in this phase. A broad mechanical move would not establish a correct upstream owner.

Laravel middleware is not only route-declaration middleware: controller-level middleware can be scoped with `only`/`except`, and resource routes support per-action middleware/exclusions. The current `LaravelRouteAuthorizationSemanticJudgment` is therefore only the judgment for the middleware evidence currently supplied to it; it must not be treated as a complete effective authorization policy. See the official Laravel controller middleware documentation.

## Verification

Run `node scripts/audits/audit-phase2332-authorization-contract-flow.cjs`. This is a static contract/wiring audit, not a TypeScript typecheck. No `npm run build`, TypeScript build, Vitest, or CLI integration run was performed.
