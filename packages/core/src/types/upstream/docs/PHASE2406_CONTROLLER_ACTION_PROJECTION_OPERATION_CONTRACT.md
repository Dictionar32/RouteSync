# RouteSync Phase 2406 — Controller Action Projection Operation Contract

## Result

The controller-action projection gap is traced to an ownership mismatch, not a missing lookup helper. This phase deliberately does not synthesize `ControllerActionInfo` from incomplete semantic data and does not change runtime behavior.

## End-to-end trace

1. `LaravelControllerScannerExecutor.scanControllers` receives the authority-closed invocation inventory and parses source-correlated declarations.
2. For each method, it obtains the existing action semantic judgment and builds a compiler-facing `action` / `contract` projection through `controllerAstProjection`.
3. `ControllerProducer.projectMethodEvidence` publishes source evidence, while `ControllerProducer.produce` publishes `ControllerActionFlowContract[]` and the controller AST.
4. `LaravelControllerScanArtifact` publishes `actions` and `actionJudgments` as separate products. `ControllerActionJudgmentPublication` intentionally carries canonical semantic judgment and source correlation, not `ControllerActionInfo`.
5. `laravelRouteScanner.ts` forwards `controllerScan.controllers.flatMap(controller => controller.actionJudgments)` and action flow contracts. Resource route emission nevertheless receives `relationNone()` for the legacy `ControllerActionInfo` map.
6. `emitResourceRouteBoundariesFromJudgment` can therefore only select `controller_reference` or closure on that path, even when the canonical action judgment exists. The later `actionJudgmentForTarget` selection only feeds request binding; it cannot change the already-selected target variant.

## Root cause

There is no production operation that publishes a source-correlated `ControllerActionInfo` together with the canonical action judgment. `ScannedControllerActionDescriptor.create` is only a constructor over an already-complete `ScannedControllerActionParams`; `.empty` manufactures defaults and is not a valid semantic producer. `ControllerActionFlowContract` is a semantic flow product, not a complete compiler route projection. Neither can safely be cast or substituted for the other.

## Contract sufficiency decision

The existing `ControllerProducer` is the appropriate upstream-owned projection boundary to evaluate first. Its current contract publishes controller AST, action flow contracts, method contracts, and method evidence, but does not publish a route-consumable action projection. The existing action judgment publication must remain canonical and unchanged; the missing sibling projection needs an explicit, source-correlated operation contract whose output is produced from the already-closed semantic products and existing compiler projection inputs.

A valid follow-up must establish all of these before changing the resource target emitter:

- the projection producer's input identifies the exact controller/action/source span;
- the producer consumes existing closed semantic judgments and integrated response facts rather than deriving them again;
- the output carries every field required by `RouteBoundaryContractFactory` without defaults or fabricated empty values;
- the projection and canonical judgment are published as one correlated product, with an explicit unmatched/blocked outcome when a complete projection cannot be produced;
- resource target selection consumes this product directly, eliminating the empty legacy controller map;
- only after the replacement is connected may `route-scanner` / `routeProducerRelations.ts` imports be retired or their ownership migrated.

## Invocation, integrated response, executor and CLI

Invocation judgment and integrated response are already retained on `LaravelControllerScanArtifact`; Phase 2406 does not alter or duplicate those authorities. This phase also does not claim runtime-executor closure or live CLI behavior. The remaining blocker is the upstream operation that correlates a complete route projection with the canonical action judgment.

## Verification boundary

This phase adds a structural audit only. It does not run TypeScript typecheck, package build, Vitest, or live scan/sync CLI. Those checks remain unverified and must not be inferred from structural assertions.
