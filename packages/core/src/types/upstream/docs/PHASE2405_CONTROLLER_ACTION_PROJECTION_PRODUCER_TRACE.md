# Phase2405 — Controller Action Projection Producer Trace

## Outcome

This phase traces the existing controller-action projection producers and their ownership. It does **not** claim to close the route target projection gap: source inspection did not identify a production operation that publishes a complete `ControllerActionInfo` projection paired with the canonical `ControllerActionJudgmentPublication` on the active controller-scan path.

## Trace evidence

1. `LaravelControllerScannerInterface.scan` publishes `LaravelControllerScanJudgment.controllers`.
2. Each `LaravelControllerScanArtifact` carries `actions: readonly ControllerActionFlowContract[]` and `actionJudgments: readonly ControllerActionJudgmentPublication[]`.
3. `ControllerActionJudgmentPublication` contains canonical controller/action identity, source span, and `LaravelControllerActionSemanticJudgmentInterface`; it intentionally does not contain `ControllerActionInfo`.
4. `ControllerActionInfo` is currently an alias of `ScannedControllerActionParams` from `compiler/scanner/descriptors/request/controllerActionTypes.ts`.
5. `ScannedControllerActionDescriptor.create/empty` are available as descriptor constructors, but a source search did not find a production controller-scan operation publishing these descriptors into `LaravelControllerScanJudgment` or `LaravelRouteScannerInterface`.
6. The active resource emitter requires `RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>>`; the scanner supplies `relationNone()`.
7. The route correlation authority operates after a target variant is selected. It cannot replace the absent projection or retroactively change the target branch.

## Root cause

The active route emitter depends on a legacy compiler-side action descriptor, while the canonical controller scan publishes semantic action judgments and flow contracts. There is no wired, explicit producer contract that publishes the complete compiler projection as a source-correlated product with the canonical judgment. The missing piece is therefore not another consumer-side lookup or another interface declaration; it is the ownership and publication path for the existing projection product.

## Contract evaluation

- `ControllerActionJudgmentPublication` is authoritative for semantic identity, provenance, and action judgment.
- `ControllerActionFlowContract` is the existing semantic flow product.
- `ControllerActionInfo` is a separate compiler projection required by the current resource emitter.
- `ScannedControllerActionDescriptor.empty(...)` must not be used to fill this gap: it manufactures default/empty response, request, dataflow, and parameter products, which would falsely present incomplete information as a complete action projection.
- Reconstructing `ControllerActionInfo` from the semantic judgment alone is also invalid because the current projection includes response, schema, runtime-return, dataflow, error-response, and parameter fields not established by the publication contract.

## Correct next implementation

Trace the original producer for `ControllerActionInfo` and its upstream owner before changing production wiring. Evolve that existing owner (if it is still valid and complete) to publish a closed source-correlated projection/semantic-judgment product; otherwise migrate the needed projection fields into the correct upstream operation contract. Then inject that exact product into route target projection, remove the empty map, and retire active subscanner imports only after route boundary and CLI behavior are verified.

Do not add a duplicate generic resolver, synthesize an empty descriptor, or change `controller_reference` into `controller_action` merely to satisfy a structural audit.

## Verification boundary

This phase adds a source-structure regression guard and runs it with the preceding phase audits. It does not claim a production behavior fix. Typecheck, package build, Vitest, and live scan/sync CLI execution are not run here.
