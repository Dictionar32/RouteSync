# Phase 1658 — Invocation Domain Derivation Interface-First

## Goal

Keep scanner runtime as wiring only while making the upstream invocation semantic model the owner of invocation meaning and executable derivations. Do not introduce a generic callable boundary.

## Changes

- `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`
  - Replaced invocation's dependency on `SemanticJudgmentModel` and `compileSemanticJudgmentModel` with an invocation-specific `InvocationSemanticDerivationModel`.
  - Declared the eight executable invocation derivations directly in the authoritative model: evidence presence, target resolution, target ambiguity, positional binding, unmatched argument, result emission, exception emission, and unresolved target obligation.
  - Kept meaning, rule trace, obligation ownership, proof requirements, and closure semantics in the same upstream contract.
  - Made target evidence role and result/exception kinds derive from the single `INVOCATION_SEMANTIC_MEANING` constant.
  - Bumped semantic model version to 4 and public contract version to 14.
- `packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts`
  - Continues to scope evidence, lower already-declared rule terms to the relation executor, and project proof-carrying judgments.
  - Reads the target evidence role from the semantic model rather than hardcoding it.
- `packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts`
  - Remains the validated authority boundary: the algebra's judgment is checked against invocation identity, trace, obligation witnesses, and closure before returning downstream.
- `packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts`
  - Remains a thin delegate to the one-judgment authority and the separate batch authority.
- `packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts`
  - Invocation analysis remains one `executeAll(semanticKnowledgeDataFlow)` call; no target resolution, argument binding, or closure rules were added to the scanner.
- `packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts`
  - Compatibility facade exports the authoritative model and meaning contract without implementing semantics.
- Added `scripts/audits/audit-phase1658-invocation-domain-derivation-interface-first.cjs` and the root npm audit script.

## Verification

- Phase 1658 static contract/wiring audit: **9/9 passed**.
- Phase 1657 interface-first audit: **9/9 passed** after updating its expected public contract version.
- Targeted TypeScript check: **no diagnostics in the changed invocation interface/algebra/authority/executor/scanner facade files**. The broader targeted compilation still exits non-zero with numerous pre-existing diagnostics elsewhere in the repository (864 total under the available global TypeScript 5.8.3; package declares TypeScript 7.0.2).
- `npm run build`: **blocked** because `tsdown` is not installed in the workspace (`sh: tsdown: not found`).
- Vitest/runtime tests were not run because workspace dependencies are not installed.

## Remaining boundary

The generic `compileSemanticJudgmentRule` is still used only to lower the already-authored relation terms into the relation engine's representation. It no longer chooses invocation semantics from a generic law-kind registry. The general-purpose law compiler remains in the repository for other consumers, but the invocation model no longer calls `compileSemanticJudgmentModel`.
