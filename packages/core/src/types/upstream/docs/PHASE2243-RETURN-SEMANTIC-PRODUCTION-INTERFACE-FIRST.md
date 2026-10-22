# Phase 2243 — Return Semantic Production Interface-First

## Change

`ControllerReturnSemanticProductionInterface<TMethodEvidence>` is added to `core/src/types/upstream` as the typed production boundary for the existing canonical `ControllerReturnSemantic` ADT. It carries the exact method evidence, canonical `SourceFile`, and source-correlated `ControllerResponseReferenceJudgment` as one input.

`resolveControllerActionContract` no longer imports or calls `controllerReturnSemanticFromMethod` directly. It consumes `context.returnSemanticProduction.produce(...)`. The production wiring injects the existing producer through this contract. The action contract/wiring version advances from 36 to 37.

This is not a second response authority. `LaravelControllerResponseSemanticPipelineInterface` remains the owner of integrated response and continues to consume the canonical return ADT.

## CLI-to-runtime trace

`controllerInvocationManifestComposition`
→ invocation semantic pipeline / inventory authority
→ `LaravelControllerScanner`
→ action semantic judgment authority
→ request evidence projection + request semantic authority
→ body semantic judgment authority
→ `resolveControllerActionContract` consuming `ControllerReturnSemanticProductionInterface`
→ published action semantic judgment retaining the exact invocation judgment
→ action runtime executor forwarding the exact judgment
→ `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse(...)`
→ AST / manifest projection.

## Remaining ownership debt (not claimed closed)

The injected production implementation in `laravelControllerExecutionDependencies.ts` still calls `controllerReturnSemanticFromMethod` from `subscanners/controller/controllerAstCanonical.ts`. The interface makes the consumer boundary explicit; it does not retire the legacy implementation.

The resolver still directly imports legacy subscanner helpers:

- `mapResourcePhpAstToUpstream` from `subscanners/resource/resourceUpstreamExpressionCanonical`;
- `ControllerBodyEvidenceProjection` from `subscanners/controller/controllerBodyResolver`;
- `createControllerDataflowContract` and `createControllerReturnSet` from `subscanners/controller/controllerDataflowContract`;
- `expressionFromPhpAst` from `subscanners/expressionProducer`;
- `sequence` from `subscanners/resource/resourceUpstreamExpressionMappings`.

These are not renamed or relocated in this phase. The existing `legacy_action_semantic_derivation` obligation remains open and action coverage remains partial. The next phase should trace each imported product to an existing upstream contract, especially the existing controller dataflow/resource-binding judgments, and only then cut over the production dependency.

## Verification

Structural audits passed: Phase 2243 focused audit 10/10, Phase 2242 ownership audit 11/11, and Phase 2241 subscanner-bypass audit 9/9. No TypeScript typecheck, Vitest, or package build was run. These audit results do not establish compile-time correctness.
