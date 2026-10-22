# Phase2443 — Invocation Pipeline Direct Authority Wiring

## Root cause

`invocationSemanticRuntimeExecutor` accepted an invocation input and forwarded it unchanged to `InvocationSemanticAuthorityInterface.analyze`; its batch operation forwarded the full knowledge graph to `SemanticInterproceduralDataFlowAuthorityInterface.analyze`. The production invocation pipeline depended on that pass-through wrapper even though both upstream authorities already existed.

## Change

- `createInvocationSemanticPipeline` now receives the existing single-invocation authority and whole-knowledge batch authority directly.
- `analyzeInvocation` delegates to `invocationAuthority.analyze(input)`.
- `analyzeKnowledge` delegates to `batchAuthority.analyze(knowledge)`.
- `InvocationSemanticPipelineInterface` exposes both authority dependencies and no `runtimeExecutor` property.
- The pipeline contract version is 61 and names the direct authority dependency binding.
- The historical Phase2391 audit now delegates to the Phase2443 audit so it does not assert the retired production wiring.

## Scope boundary

This phase removes the invocation runtime wrapper from the production pipeline; it does not claim every runtime executor in RouteSync has been removed. `invocationSemanticRuntimeExecutor.ts` remains as a legacy public compatibility surface and requires a separate API-compatibility decision before deletion. The active manifest builder still calls `sourceAstPipeline.execute(pipelineInput)`; that is a source-pipeline boundary, not addressed by this change.

## Validation

The Phase2443 static audit checks direct authority wiring and explicitly records the remaining manifest pipeline boundary. Syntax-only transpilation and repository-wide typecheck/build/test results must be reported separately; a passing structural audit is not equivalent to a passing build or end-to-end CLI run.
