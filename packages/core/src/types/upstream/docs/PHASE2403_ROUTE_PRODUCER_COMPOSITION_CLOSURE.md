# Phase2403 — Route Producer Composition Closure

## Scope

This phase continues from Phase2402 by repairing one concrete operation-contract defect in the active route path. It does not claim full Route Scanner interface-first closure.

## Trace and root cause

The active scanner calls the existing injected `routeProducerInputComposition.compose(...)` operation. Its implementation in `subscanners/routeProducerRelations.ts` delegated to `routeProducerInputFromRouteBoundary(..., relationNone())`. That projection accepted an optional controller-action map and attempted to refine route parameters using the map. The only active caller always supplied `relationNone()`, so the lookup and refinement could never produce a controller action or change a parameter. The operation contract therefore carried a phantom optional input and dead lookup path rather than a useful closed dependency.

## Change

- Removed the optional controller-map argument from `routeProducerInputFromRouteBoundary`.
- Removed the unreachable controller-map lookup and implicit-model-binding refinement helpers that depended on that argument.
- Preserved the already-closed `route.identity.parameters.all` from `RouteBoundaryContract` when composing `RouteProducerInput`.
- Kept the existing `RouteProducerInputComposition` contract and its injected execution path; no duplicate interface was introduced.
- Kept `routeProducer.produce` as the sole `RouteAst` materializer.

This is behavior-preserving for the active wiring because that wiring always passed an empty controller map. It does not establish that controller-action model binding is fully supported; it removes a no-op path that falsely implied that it was.

## Remaining blockers

1. `emitResourceRouteBoundariesFromJudgment` still receives an empty controller map, so resource route targets may remain `controller_reference` instead of a controller-action target.
2. `laravelRouteScanner.ts` still owns declaration dispatch and imports active emission from `subscanners/route-scanner`.
3. `routeProducerRelations.ts` remains in `subscanners` and imports `semantic/relations`.
4. Full Runtime Executor and live scan/sync CLI closure has not been demonstrated.

## Verification

The Phase2403 structural audit checks the operation contract wiring, removal of the unreachable producer-map path, preservation of manifest-owned invocation judgments, and explicit visibility of remaining blockers. The audit is not a substitute for TypeScript typechecking, Vitest, package build, or live CLI execution.
