# Phase 1706 — Invocation Coverage Interface Truth

## Scope

Interface-first only. The pipeline contract now distinguishes the source-model vocabulary from the actual judgment domain, so the pipeline does not imply that every call-shaped fact is analyzed.

## Trace finding

- `semanticDataflowKnowledge.ts` defines both `SemanticInvocation` (`kind: invocation`) and `SemanticStaticInvocation` (`kind: static-invocation`).
- `phpAstExpressionSyntaxEvidenceRegistry.ts` emits `static-invocation` facts.
- `invocationSemanticJudgmentAlgebra.ts` currently selects only facts where `fact.kind === 'invocation'`.
- `controllerDataflowAnalyzer.ts` correctly delegates to `invocationSemanticPipeline.analyzeKnowledge(...)`; it should not duplicate or locally patch the missing static-call reasoning.

## Interface change

- Added `InvocationSemanticCoverageContract` and its immutable value.
- Bumped `InvocationSemanticPipelineContract` from version 12 to 13.
- Declared current judgment coverage as ordinary invocation only.
- Explicitly records that static-invocation facts must remain visible as uncovered source facts until their subject ADT, judgments, obligations, proof, and authority validation are designed and implemented.
- No production scanner wiring, semantic algebra, authority, or executor was changed in this phase.

## Verification

Run `npm run audit:phase1706-invocation-coverage-interface-truth`.

This is a source-contract audit, not a TypeScript build. The existing build limitation from the previous phase (`tsdown` unavailable in the workspace) remains separate and is not represented as a pass.
