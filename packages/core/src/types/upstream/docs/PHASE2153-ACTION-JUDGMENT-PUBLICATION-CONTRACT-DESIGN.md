# Phase 2153 — Action Judgment Publication Contract Design

## Decision

Do not add a parallel route-request authority, `relation/foundation`, or a subscanner. The missing data is already produced by `executionDependencies.actionJudgment.judge(...)`; the failure is publication and consumption, not semantic derivation.

## Exact trace

1. `LaravelControllerScannerExecutor.scanControllers` creates one action judgment per selected method.
2. `actionExecution.execute({ semanticJudgment })` forwards that exact judgment.
3. The loop currently keeps `semanticJudgment.semantic` only in a local `controllerMethods` value; `controllerProducer.produce(...)` publishes `produced.actions`, not the judgment values.
4. `LaravelControllerScanArtifact` publishes `actions`, `invocationJudgment`, `responseJudgment`, and `projectionJudgment`, but no per-action judgment collection.
5. `laravelRouteScanner.scanRoutes` flattens only `controller.actions` and creates the route boundary from `RouteEmission` before route binding.
6. `routeBoundaryContractFromRouteEmission` maps a `controller_reference` target to `request: { kind: 'no_request' }`. The canonical `semantic.request` cannot reach this branch.

## Interface-first implementation contract

The implementation must evolve existing contracts, not create another authority:

- `LaravelControllerScanArtifact`: publish a source-correlated collection of the exact per-action judgments produced by the existing `actionJudgment` authority and forwarded by `actionExecution`.
- `LaravelRouteScannerInterface` / its existing input: expose those same judgments to route boundary construction without reconstructing them from `ControllerActionInfo`.
- Existing route boundary contract: consume the matched action judgment's `semantic.request` as an already-closed value and project it exhaustively to `RouteRequestBinding` (`no_request`, `form_request`, `framework_request`, `typed`, `typed_unresolved`). For FormRequest, retain the route resource identity at the route boundary.
- `routeProducerRelations.ts`: remain a projection consumer. It must not infer request meaning from PHP syntax or silently downgrade an unrecognized canonical variant to `no_request`.
- Correlation key: controller identity + action identity + source-file identity. Ambiguous or absent matches must remain explicit unresolved/blocked outcomes, never “first match wins” semantic inference.
- Preserve the exact invocation judgment on each action judgment; integrated controller response remains a separate, correlated response judgment and must not be substituted for per-action response semantics.

## Why not add the field with an improvised type

`LaravelControllerActionSemanticJudgmentInterface<TProjection>` currently carries a projection type (`ControllerActionContract`) that is owned in the compiler/scanner layer. Importing that concrete compiler type into `types/upstream/laravelControllerScannerInterface.ts` would reverse the intended dependency direction. Before changing the artifact, the contract needs an upstream-safe projection type or a generic artifact parameter threaded through the existing scanner boundary. Do not hide this issue with `unknown`, a cast, or a second reduced “judgment” object.

## Closure criteria

`typed_request_binding_projection_loss` stays open until source code demonstrates that all five canonical request variants flow from the existing action judgment through the controller artifact, route boundary, and endpoint projection. A static trace audit is not evidence of end-to-end type correctness; full build/typecheck/Vitest are intentionally not run in this environment.
