# RouteSync Phase 2407 — Integrated Response Route Projection Ownership

## Decision

The previous phase correctly rejected synthesizing `ControllerActionInfo`, but its proposed next owner (`ControllerProducer`) is not sufficient to close the route target contract. This phase corrects that ownership conclusion from the executable order in `laravelControllerScanner.ts`.

## Source trace

1. Per-method canonical action judgment is created by `executionDependencies.actionJudgment.judge(...)` and executed by `actionExecution.execute(...)`.
2. The sibling compiler projection (`actionPublication.projection`) is created during action judgment, but the canonical action contract deliberately does not retain a `ResponseDescriptor`.
3. `controllerProducer.produce(...)` is invoked with `ControllerDeclarationEvidence` and `invocationJudgment` before the controller-wide integrated response pipeline is run.
4. `responseSemanticPipeline.judgeIntegratedResponse(...)` runs only after `produced` and the `actionJudgments` have already been assembled.
5. The integrated response domain publishes source-correlated `LaravelControllerMethodResponseProduct` / AST projection products. Its contract explicitly tracks the resolved response-attribute descriptor as an open coverage item (`resolved_response_attribute_descriptor`).
6. The active resource route emitter still requires `ControllerActionInfo`, including `response: ResponseDescriptor`, and the scanner passes `relationNone()` as its controller map. The emitter therefore cannot select the `controller_action` branch on that map path.

## Root cause

The missing piece is not merely a controller-action projection publisher. The active controller producer runs before integrated response composition and cannot lawfully publish a complete route-facing projection that requires the closed response result. Meanwhile, the integrated response pipeline has source-correlated method response products, but does not yet close the legacy-compatible response descriptor projection required by `RouteBoundaryContractFactory`.

Consequently, making `ControllerProducer` emit `ControllerActionInfo` would either reintroduce the retired parallel response derivation or invent fields. Adding a second lookup or filling `ScannedControllerActionDescriptor.empty()` would conceal the ownership defect. Neither is acceptable.

## Correct upstream closure

Evolve the existing `LaravelControllerResponseSemanticPipelineInterface` and its existing method response projection contract—not a new runtime helper—to publish a closed, source-correlated route-response projection suitable for the route boundary. The operation must:

- correlate the exact canonical action judgment, method response product, and invocation identity;
- produce an explicit closed ADT for complete vs blocked route projection;
- preserve the canonical response product as authority and keep any compatibility `ResponseDescriptor` as a projection, never as semantic input;
- never infer a missing response from an empty descriptor or reconstruct a second response classifier;
- be consumed by the route target projection operation before resource target selection;
- allow removal of the empty `ControllerActionInfo` map only after the replacement path is wired and regression-verified.

After that upstream operation is available, the route boundary should consume a correlated product (canonical action judgment + complete route-facing projection) rather than rejoin independent arrays or read a legacy descriptor as semantic authority. Existing invocation judgment, integrated response judgment, and runtime executor contracts must remain the sole authorities for their respective concerns.

## Runtime and CLI status

This phase does not claim the route-target gap is closed. The route scanner still uses the legacy emitter and empty controller map. Invocation and integrated response are already wired into the controller artifact; that fact alone does not establish route projection or runtime/CLI closure.

## Verification boundary

The audit associated with this phase checks the ownership/order facts above. It is structural source inspection only. TypeScript typecheck, package build, Vitest, and live scan/sync CLI were not run. No production source was modified because no complete route-facing response projection exists to wire safely; inventing one here would violate the upstream-authority constraint.
