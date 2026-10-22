# Phase 2210 — Invocation Executor Explicit Delegation Trace

## Change

The existing `InvocationSemanticRuntimeExecutorInterface` now states the two delegation owners explicitly in its contract. `executeAll` calls `batchAuthority.analyze(knowledge)` through a wrapper rather than publishing the authority method as a detached function reference. This preserves the authority receiver if an implementation relies on method binding, while keeping the executor free of semantic interpretation.

The Phase 2209 test now checks this explicit delegation contract in addition to the identity of the individual and batch contracts.

## Ownership trace

- `InvocationSemanticAuthorityInterface.analyze`: one invocation, one closed PHP invocation judgment.
- `SemanticInterproceduralDataFlowAuthorityInterface.analyze`: whole-knowledge analysis, not a list of independently supplied invocations.
- `InvocationSemanticRuntimeExecutorInterface`: delegates each operation to its corresponding authority and does not derive target, argument binding, effects, proof, obligations, or closure.
- `InvocationSemanticIntegratedResponseCompositionInterface.integrate`: composes PHP invocation judgment with related semantic knowledge; it is not Laravel HTTP response judgment.
- `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse`: owns the Laravel HTTP response judgment correlated to the exact invocation judgment.
- `LaravelControllerAstProjectionSemanticAuthorityInterface`: projects the correlated judgment pair without recreating either one.

## Laravel scanner gaps retained honestly

1. `legacyLaravelControllerExecutionDependencies.actionJudgment.judge` still calls `scanControllerAction`, which reaches `resolveControllerActionContract`. Body source-AST derivation and response-descriptor resolution remain legacy-owned; resource-binding judgment exists upstream, but its publication still traverses the legacy action adapter.
2. `laravelSourceAstPipeline.ts` still directly calls `ChannelScanner.scanCanonicalAsts(sourceProject)`. The source-project boundary does not yet provide a proven client-subscription evidence inventory, so a valid authority cutover cannot be completed by supplying empty evidence or retaining pattern inference.
3. `semantic/relations` remains imported across scanner producers, descriptors, and symbol tables. No replacement `relation/foundation` layer or new subscanner was introduced. A safe removal requires tracing each call's domain meaning and owner; generic sequence/collection operations should not be confused with semantic judgments.

## Next correct semantic migration

The next high-value cutover is not another executor wrapper. It is to feed the existing controller body authority's source-correlated judgment into the action judgment as an already-computed product, and to give response-descriptor resolution an explicit typed upstream judgment that preserves all existing descriptor ADT variants. Only then can the legacy action resolver stop owning those derivations without losing evidence or silently changing behavior.

## Validation

This phase is limited to source edits, syntax transpilation, structural assertions, and ZIP integrity. Full typecheck, Vitest, and package build were not run; no `npm run build` was invoked.
