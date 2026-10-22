# Phase 2150 Trace

`LaravelControllerInvocationSemanticJudgmentInterface`
→ `invocationSemanticRuntimeExecutor.execute(input)`
→ `InvocationSemanticAuthorityInterface.analyze(input)`
→ exact validated invocation judgment
→ source-correlated `ControllerDataflowSemanticJudgmentAuthority`
→ `InvocationSemanticIntegratedResponseCompositionInterface.integrate(...)`
→ inventory + analysis over the same `semanticKnowledgeProjection.knowledge`
→ existing publication authority
→ integrated response containing exact publication result + exact PHP invocation pipeline outcome
→ scanner-facing judgment retains integrated response and original invocation judgment.

Separate Laravel HTTP response path:
`LaravelControllerScanner`
→ existing `responseSemanticPipeline.judgeIntegratedResponse(...)`
→ existing response judgment / AST projection.

Open side-path:
`ControllerActionContract.request`
→ `routeProducerRelations.ts`
→ route request binding. Non-form/non-framework request kinds still collapse to `no_request`; this is explicitly not claimed fixed in Phase 2150.
