# Phase 2209 — Authority Contract Identity and Laravel Scanner Trace

## Change made

`InvocationSemanticRuntimeExecutorInterface` now exposes `batchContract` separately from `contract`.

- `execute(input)` is governed by `InvocationSemanticAuthorityInterface.analyze` and returns one invocation judgment.
- `executeAll(knowledge)` is governed by `SemanticInterproceduralDataFlowAuthorityInterface.analyze` and returns whole-knowledge analysis.
- Both contract identities are visible at the executor boundary. The current composition root supplies the same `INVOCATION_SEMANTIC_CONTRACT` object to both authorities, and the new test asserts that identity. This avoids implying that a single-operation contract silently governs a separately wired batch authority.
- The executor remains a delegator; no invocation semantics, proof, trace, obligation, or closure are created inside it.

## Trace: invocation → integrated response → Laravel scanner

1. `InvocationSemanticAuthorityInterface.analyze` is the PHP invocation semantic owner. Its closed judgment contains the requested invocation, target resolution, argument binding, effect flows, obligations, and proof/trace.
2. `InvocationSemanticRuntimeExecutorInterface.execute` delegates to that authority. `executeAll` remains a different operation and is now contract-visible as such.
3. `LaravelControllerInvocationSemanticJudgmentAuthority.judge` binds the pipeline result to the exact controller source and composes the existing PHP invocation integration ADT. It does not replace the lower-level invocation authority.
4. `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` owns Laravel HTTP response semantics. Its result remains correlated to the exact invocation judgment; it is not a synonym for PHP invocation integration.
5. `LaravelControllerAstProjectionSemanticAuthorityInterface` projects the exact invocation/response pair without reconstructing either judgment.
6. CLI/source-AST consumers should publish the correlated judgment inventory and method response products, not reclassify controller ASTs.

## Concrete remaining Laravel scanner gap

The production composition in `packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts` still implements `actionJudgment.judge` by calling `scanControllerAction(...)`. That reaches `resolveControllerActionContract(...)` and still derives legacy action products. The upstream action judgment honestly marks coverage as `action_semantic_knowledge_partial`, with typed remaining obligations for body derivation, response-descriptor resolution, and resource-binding publication.

This is not closed by adding another interface around `scanControllerAction`, moving it, or calling its output a judgment. The next actual semantic migration must replace the legacy derivation with source-correlated upstream judgments for the still-open products, then make the action executor consume those completed judgments. The existing request-binding authority should remain the sole request-kind owner.

## Other traced open boundary

`packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` still directly calls `ChannelScanner.scanCanonicalAsts(sourceProject)`. `LaravelChannelScannerInterface` requires client-subscription evidence and `BroadcastChannelKindJudgmentAuthority`; no source-backed client subscription inventory is currently supplied by this Laravel source-project boundary. Do not wire empty evidence or retain pattern-based inference and claim authority closure.

`semantic/relations` remains widely imported by scanner producers, descriptor code, and symbol tables. This phase does not rename or relocate it, and does not add `semantic/foundation` or replacement subscanner layers. Each use needs a semantic-owner trace before any removal is safe.

## Validation boundary

The phase test is added but Vitest and full typecheck were not run here. TypeScript transpilation checks, archive integrity, and structural assertions are performed separately; no package build is run.
