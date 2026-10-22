# Phase2404 — Route Target Projection Authority Audit

## Result

This phase is a targeted authority/contract audit, not a claim that the route path has been fully repaired. It traces the remaining blocker from the concrete route scanner and identifies why filling the controller map from semantic publications would be an invalid shortcut.

## Trace

`LaravelControllerScanJudgment.controllers[].actionJudgments` publishes `ControllerActionJudgmentPublication` values containing canonical controller/action identity, source span, and `LaravelControllerActionSemanticJudgmentInterface`. The publication intentionally does not contain the compiler-side `ControllerActionInfo` projection.

The active route scanner calls `emitResourceRouteBoundariesFromJudgment(...)` with a `controllerMap` typed as `RelationIndex<string, RelationIndex<string, ControllerActionInfo>>`, but passes `relationNone()`. The emitter can only select its `controller_action` target branch from that compiler projection map; otherwise it emits `controller_reference` or closure targets.

The subsequent `actionJudgmentForTarget(...)` correlates the target identity to semantic publications. That correlation preserves semantic judgment provenance, but it cannot retroactively change the target variant or synthesize the absent `ControllerActionInfo` projection.

## Root cause

The route target emitter consumes a legacy compiler projection (`ControllerActionInfo`), while the canonical upstream publication is a semantic judgment. There is no explicit contract in the active route scanner that projects the canonical action judgment into the complete compiler-side target information required by `RouteBoundaryContract`.

This is an ownership/contract gap, not a missing import. Supplying an empty map, reconstructing `ControllerActionInfo` ad hoc from semantic fields, or adding a parallel interface would hide rather than solve the gap.

## Contract sufficiency

- `ControllerActionJudgmentPublication` is sufficient for identity/provenance correlation and semantic request judgment selection.
- `RouteBoundaryContract` is sufficient to preserve the final route boundary, including its closed target/binding/capability/provenance contracts.
- `ControllerActionInfo` remains a compiler projection needed by the existing resource emitter to select its `controller_action` branch.
- The active path lacks an explicit, existing owner that supplies the exact projection alongside the semantic judgment without re-deriving semantics.

Therefore, the safe next implementation must trace the controller AST/action projection producer and its existing interface, then evolve that owner to publish the needed projection as a source-correlated pair with the canonical action judgment. Only after that projection is contractually available should the resource target emitter be rewired and the subscanner dependency retired. Do not create a projection from incomplete semantic fields.

## Full chain status

| Segment | Status | Evidence |
|---|---|---|
| Invocation judgment → controller artifact | Existing integrated controller pipeline | `LaravelControllerScanArtifact` carries invocation, response, and projection judgments as correlated products. |
| Invocation judgment → concrete manifest | Structurally closed in Phase2401 | `RouteSyncManifest` owns `invocationSemanticJudgments`; flow reads the manifest property. |
| Integrated response → controller projection | Existing response semantic pipeline | `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` is the response authority; do not confuse it with PHP invocation composition. |
| Route target projection → boundary | **Open** | Resource emitter receives an absent controller map; canonical action publication omits `ControllerActionInfo`. |
| Route scanner ownership | **Open** | Active scanner still imports `subscanners/route-scanner` and `subscanners/routeProducerRelations`; latter imports `semantic/relations`. |
| Runtime executor → live CLI | **Not end-to-end verified** | Existing structural audits cover wiring, not an actual Laravel scan/sync execution. |

## Verification boundary

This audit deliberately does not claim a source-code fix to the open route-target projection gap. It adds a regression guard so the known blocker cannot be described as closed while the empty map and subscanner imports remain. Full typecheck, package build, Vitest, and live scan/sync execution were not run in this environment.
