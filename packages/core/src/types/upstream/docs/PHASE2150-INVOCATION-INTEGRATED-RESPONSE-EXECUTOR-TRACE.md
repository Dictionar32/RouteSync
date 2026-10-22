# Phase 2150 — Invocation Judgment / Integrated Response / Runtime Executor Trace

## Scope

Evaluate the existing interface-first path from invocation semantic authority through the runtime executor and integrated response composition, while preserving the unresolved Laravel route request projection gap as an explicit migration obligation.

## Verified trace

1. `invocationSemanticRuntimeExecutor.execute(input)` delegates directly to `authority.analyze(input)` and returns the judgment without rebuilding it.
2. `invocationSemanticPipeline.analyzeInvocation(input)` forwards to the existing executor. Whole-knowledge analysis remains a separate operation from a list of independent invocation inputs.
3. `createInvocationSemanticIntegratedResponseComposition` obtains one canonical `knowledge` reference from `semanticKnowledgeProjection.knowledge`, then passes that same value to inventory and semantic analysis before publication.
4. The integrated response retains the exact publication result and the exact `phpSourceInvocationPipeline` outcome; composition does not reclassify or reconstruct either component.
5. `controllerDataflowSemanticJudgmentAuthority` checks source-file identity across source correlation, invocation judgment, and semantic-knowledge projection before composition. It forwards the exact projection and `invocationJudgment.response` into the composition and retains both the integrated response and original invocation judgment in its result.
6. Laravel controller scanner continues to use the existing `responseSemanticPipeline.judgeIntegratedResponse` boundary.

## Interface evaluation

The invocation path already has the desired ownership separation: semantic algebra derives; authority validates; runtime executor delegates; composition sequences existing owners; the scanner forwards source-correlated judgments. This phase does not create another invocation authority, a `relation/foundation` layer, or a subscanner.

## Remaining defect (not closed)

`routeProducerRelations.ts` still maps request kinds other than `form_request` and `framework_request` to `no_request`. Consequently, the canonical controller request outcomes `typed` and `typed_unresolved` are not yet preserved through route binding. Phase 2149's `typed_request_binding_projection_loss` obligation remains open. It must be closed by evolving the existing route request ADT and its consumers, then wiring the canonical judgment to that boundary—not by fabricating a type resolution in the route producer.

## Verification

- Phase 2150 static contract audit and syntax-only TypeScript transpilation: 21/21 passed.
- Phase 2149 request projection audit: 11/11 passed.
- Phase 2148 request source authority audit: 16/16 passed.
- No full build, full typecheck, or Vitest run.
- These checks validate source structure and syntax only, not complete runtime correctness.
