# Phase2385 — Route Subscanner Retirement and RouteEmission Consumer Trace

## Scope and result

This phase applies a bounded retirement cutover using existing contracts. It does not claim the complete route declaration pipeline is closed.

### Code changes

1. Deleted the unreferenced legacy `packages/core/src/compiler/scanner/subscanners/RouteScanner.ts` implementation. The active production entrypoint remains `LaravelRouteScannerInterface` through `wiring/laravelRouteScanner.ts`.
2. Deleted `packages/core/src/compiler/scanner/subscanners/routeProducer.ts`, which was only a compatibility re-export of the canonical `types/upstream/routeProducer.ts`.
3. Updated the two Phase52 type-level tests to import the canonical upstream `routeProducer` directly.
4. Added `scripts/audits/audit-phase2385-legacy-route-scanner-retirement.cjs`; it passes 6/6 structural assertions.

No new interface, authority, ADT, or runtime layer was introduced.

## RouteEmission trace — remaining active consumers

The active scanner still imports these subscanner APIs:

- `emitResourceRouteBoundariesFromJudgment`
- `emitStandardRouteBoundaries`
- `StandardRouteTarget`
- `RouteEmission`

The active path also imports `routeBoundaryContractFromRouteEmission`, `routeProducerInputFromRouteBoundary`, `routeSemanticFlowFromRouteBoundary`, and `routeDeclarationEvidenceFromAst` from `subscanners/routeProducerRelations.ts`.

The direct `RouteEmission` references remaining in production code are in:

- `subscanners/route-scanner/routeEmitter.ts` (its return type and legacy emission operations)
- `subscanners/routeProducerRelations.ts` (post-emission boundary projection)
- `wiring/laravelRouteScanner.ts` (callback type and action-correlation dispatch)
- `subscanners/route-scanner/index.ts` (exports)

The boundary contract is still produced after the emitter has constructed an intermediate route value. This is the next actual integration gap; the deleted legacy `RouteScanner` class was not the active path and deleting it alone does not solve that gap.

## Ownership and minimal next change

Existing canonical contracts remain the intended route:

`RouteDeclarationEvidence → LaravelRouteDeclarationMethodJudgment → RouteResourceFlowJudgment / ResolvedLaravelRoutePath + authorization judgment → RouteBoundaryContract → RouteProducerInput → RouteProducer → RouteAst`

The next implementation must eliminate `RouteEmission` from the active path by producing the existing `RouteBoundaryContract` directly from the already-resolved route facts, then remove the active dependency on `subscanners/route-scanner` and `subscanners/routeProducerRelations`. Reuse `RouteBoundaryContractFactory`, `RouteBoundaryOptions`, `RouteProducerInput`, and `RouteProducer`; do not add another authority/interface or merely relocate the old emitter.

## Validation status

- `node scripts/audits/audit-phase2385-legacy-route-scanner-retirement.cjs`: PASS 6/6.
- Full TypeScript typecheck, package build, and end-to-end CLI regression were not run in this workspace. This report does not claim them as passing.
