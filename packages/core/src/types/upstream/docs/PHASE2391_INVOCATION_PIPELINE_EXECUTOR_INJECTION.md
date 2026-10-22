# Phase2391 — Invocation Pipeline Executor Injection

## Scope

Close the hidden runtime dependency in the existing upstream invocation semantic pipeline. This phase does not add a new semantic authority or a second invocation contract.

## Audit and root cause

`invocationSemanticPipeline.ts` previously implemented `analyzeInvocation`, `analyzeBatch`, and `analyzeKnowledge` by reaching directly into the module singleton `invocationSemanticRuntimeExecutor`. The integrated-response composition already accepted `InvocationSemanticPipelineInterface`, but that interface did not expose the executor actually governing those operations. Therefore, its public dependency surface was weaker than the actual execution path.

## Change

- Evolved existing `InvocationSemanticPipelineInterface` to expose the exact `InvocationSemanticRuntimeExecutorInterface` dependency.
- Added `createInvocationSemanticPipeline(runtimeExecutor)` using the existing runtime executor contract.
- Routed single invocation and whole-knowledge operations through the injected executor; batch analysis continues to preserve input order and delegates each entry through the same injected executor.
- Kept the production singleton only at the composition root: `createInvocationSemanticPipeline(invocationSemanticRuntimeExecutor)`.
- Evolved the existing `InvocationSemanticPipelineContract` version 59 → 60 and recorded the executor dependency-binding invariant.
- Kept integrated-response composition using its existing injected `pipeline.analyzeKnowledge` operation.

## Resulting chain

`InvocationSemanticAuthorityInterface → InvocationSemanticRuntimeExecutorInterface → createInvocationSemanticPipeline(runtimeExecutor) → InvocationSemanticPipelineInterface → InvocationSemanticIntegratedResponseCompositionInterface.integrate → Laravel controller response/scanner path`

The runtime executor still delegates to the upstream invocation authority and batch authority. It does not own semantic derivation. The pipeline is wiring and preserves those authority results.

## Validation

`node scripts/audits/audit-phase2391-invocation-pipeline-executor-injection.cjs` checks the dependency contract, factory delegation, production composition root, integrated-response use, and executor transparency.

Full typecheck, Vitest, package build, and CLI end-to-end execution are not claimed by this structural audit.

## Remaining gaps

- Active route scanner dependencies on `subscanners/route-scanner` and `subscanners/routeProducerRelations` remain unresolved.
- Full CLI `scan`/`sync` execution and regression suite still need to run in a supported project environment.
- Static invocation semantic coverage remains explicitly unimplemented by the existing pipeline contract and is not changed in this phase.
