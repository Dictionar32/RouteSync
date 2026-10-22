# Phase 2116 source trace

1. `packages/core/src/types/upstream/astClassifierEvidenceContract.ts` — expression and block request/result remain separate ADT variants, exposed through correlated overloads.
2. `packages/core/src/types/upstream/scannerTokenStructureInterface.ts` — existing delimiter evidence and `matched | not_found | malformed` judgment.
3. `packages/core/src/types/upstream/scannerTokenStructureAlgebra.ts` — implementation of leading delimiter matching; the AST runtime consumes its public interface rather than recreating delimiter matching with relation helpers.
4. `packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts` — `classifyParenthesized` now returns a closed `AstRuleResolution`; `AST_CLASSIFICATION_RULES` selects the `judgment` variant for the parenthesized candidate.
5. `packages/core/src/compiler/scanner/lexer/astParenthesizedExpressionJudgment.phase2116.test.ts` — focused regression for projecting a matched parenthesized expression.

Remaining frontier: other AST expression candidates still use `legacy_adapter` and relation-backed helper implementations. The next migration must be selected by source trace and preserve malformed/blocked evidence; removing imports mechanically would not establish semantic ownership.
