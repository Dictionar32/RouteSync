# Phase 2152 — Canonical Action Judgment to Route Boundary Trace

## Result

This phase is a source-trace and ownership-boundary audit. It deliberately does **not** claim the typed-request projection gap is closed: the current public scanner artifact does not carry the canonical per-action judgment to the route scanner. Wiring cannot be completed honestly by changing only `routeProducerRelations.ts` because the judgment is discarded before route acquisition.

## Exact invocation / action / response trace

1. `LaravelControllerScannerExecutor.scanControllers` receives the closed invocation inventory and parses the source-bound declaration.
2. For each selected action, `executionDependencies.actionJudgment.judge(...)` receives the exact `invocationJudgment` and derives `semantic.request` through `canonicalRequestBinding(...)`, which delegates to `laravelControllerRequestSemanticBindingAuthority.judge(...)`.
3. `actionExecution.execute({ semanticJudgment })` forwards the completed judgment unchanged. The returned semantic request exists at this point.
4. The controller scanner's local `controllerMethods` rows retain `semantic`, but publication constructs `LaravelControllerScanArtifact` with `ast`, `actions: produced.actions`, `resourceBindings`, `invocationJudgment`, `responseJudgment`, and `projectionJudgment`. The per-action `semanticJudgment` is not published as part of the artifact.
5. `LaravelRouteScanner.scan` receives the artifact and passes only `controllerScan.controllers.flatMap(controller => controller.actions)` to route binding. It creates each route boundary from `RouteEmission` before the binding authority runs.
6. `emitDeclaration` creates controller targets as `controller_reference` with an unresolved response. `routeBoundaryContractFromRouteEmission` initializes their request as `no_request`; it has no canonical action judgment input.
7. `routeProducerInputFromRouteBoundary` faithfully projects the request ADT it receives (`typed_request` to `inline_input`, `unresolved_request` to `unresolved_input`). This projection cannot recover facts already discarded at step 4/6.

## Integrated response and runtime executor

The integrated response path remains distinct and correlated: the controller scanner invokes `responseSemanticPipeline.judgeIntegratedResponse({ invocationJudgment, declarationEvidence })`, then `astProjection.judge({ kind: 'integrated_invocation_response_judgment', judgment: invocationJudgment, responseJudgment })`. The action runtime executor only forwards its action judgment. Neither path itself wires the per-action request judgment into route-boundary construction.

## Correct interface-first next change

Evolve the **existing** `LaravelControllerScanArtifact` publication contract so each action's canonical judgment is retained alongside its existing action projection, with explicit controller/action/source identity correlation. Then evolve the existing `LaravelRouteScannerInterface`/route-boundary construction input to consume that published judgment and project `semantic.request` into the already-evolved `RouteRequestBinding` ADT. Keep the route producer as a projection-only consumer. Do not add `relation`/`foundation` authorities, a new subscanner, or another competing request authority; do not infer controller identity from a basename when a typed source identity is available.

The publication ADT must make the judgment-to-action correspondence total and source-correlated; an optional loose array or a runtime search by untyped strings would not close the semantic contract. Once wired, audit every route target variant and prove `typed`, `typed_unresolved`, `form_request`, `framework_request`, and no-request outcomes survive to `EndpointRequestBinding`.

## Current closure status

`typed_request_binding_projection_loss` remains open. Phase 2151 established the route/endpoint ADT capacity and preserved unresolved evidence when supplied, but canonical action request judgment still does not reach that boundary. No full build, typecheck, or Vitest run was performed in this phase.
