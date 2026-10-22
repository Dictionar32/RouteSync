# RouteSync Phase 2402 — Route Interface-First Closure Audit

## Scope

Continue after Phase2401's manifest ownership correction. Trace the route operation from the existing `LaravelRouteScannerInterface` through route boundary production, `RouteProducerInputComposition`, `RouteProducer`, and the manifest path. This phase is an evidence-backed gap audit, not a claim that the route path is already interface-first.

## Closed in prior phase

- The concrete `RouteSyncManifest` owns `invocationSemanticJudgments`.
- The manifest builder transfers `invocationInventoryReceipt.correspondences` directly.
- `routeSyncManifestFlowProjection` reads `manifest.invocationSemanticJudgments` and does not reach into `manifest.ast` for this property.

## Trace of the active route path

`LaravelRouteScannerInterface.scan` → `scanRoutes` in `compiler/scanner/wiring/laravelRouteScanner.ts` → `routeDeclarationEvidenceFromAst` from `subscanners/routeProducerRelations.ts` → `LaravelRouteDeclarationMethodJudgmentAuthority.judge` → scanner-local `emitDeclaration` → `emitResourceRouteBoundariesFromJudgment` / `emitStandardRouteBoundaries` from `subscanners/route-scanner` → `routeBoundaryContractFromRouteFacts` from `subscanners/routeProducerRelations.ts` → injected `RouteProducerInputComposition.compose` → `RouteProducer.produce` → route artifact / manifest projections.

## Root causes found

1. **The interface is not the complete operation authority.** `LaravelRouteScannerInterface` injects method, authorization, resource-flow, path-resolution, correlation, producer-input composition, and AST producer operations, but declaration-to-boundary dispatch remains the scanner-local `emitDeclaration` function. The injected contract therefore does not own the full operation that selects and composes the boundary.
2. **The active route path still depends on subscanners.** `laravelRouteScanner.ts` imports both `subscanners/route-scanner` and `subscanners/routeProducerRelations.ts`; the latter still imports `semantic/relations` and relation-membership operations. The old route scanner implementation may have been retired, but the active emitter/projection dependencies have not.
3. **Resource action target is not closed from the available upstream action judgment.** The active resource emitter is passed `relationNone()` as its controller map. Its `controller_action` variant therefore cannot be selected through that map in this path; the route target tends to remain `controller_reference`. Route/action correlation is applied afterward, which does not retroactively make the emitter's target selection authority-complete.
4. **Producer-input composition repeats the missing action-information gap.** `routeProducerInputComposition` passes `relationNone()` to `routeProducerInputFromRouteBoundary`; the latter's optional controller map is then unavailable for `refineImplicitModelBindings`. The operation contract exists, but its input is not sufficient to carry the needed closed controller-action product.
5. **The semantic judgment publication intentionally omits compiler projection.** `ControllerActionJudgmentPublication` carries the semantic judgment, identity, and source span, not `ControllerActionInfo`. That separation is correct, but it means the route path must obtain any needed compiler projection through an explicit existing projection contract instead of synthesizing it from the semantic judgment or supplying an empty map.

## Correct next implementation boundary

Evolve the existing route operation contracts rather than creating a parallel scanner or moving `emitDeclaration` to another file and declaring victory. The next implementation must:

- make declaration-evidence → complete route-boundary judgment an explicit upstream-owned operation in the existing scanner contract;
- ensure that operation consumes the already judged method, path/resource flow, authorization, and controller-action correlation products;
- provide resource-target selection and producer-input composition with the exact existing action projection through a typed closed contract, without `relationNone()` placeholders;
- retire the active `subscanners/route-scanner` and `subscanners/routeProducerRelations` dependencies only after the canonical replacement is wired and checked;
- keep runtime/scanner execution as materialization only, and keep semantic/fallback logic out of CLI.

## Validation boundary

The audit is source-structural. It does not prove TypeScript type safety, test execution, or real Laravel CLI behavior. No package build, full typecheck, Vitest run, or live scan/sync invocation is claimed in this phase.
