# Phase 1557 — Interface-first semantic decision proof

## Architectural change

The upstream `SemanticDecisionContract` now declares its selection law explicitly (`first_proven_by_precedence`). The upstream semantic decision algebra emits a proof-bearing judgment: the ordered rule-evaluation prefix, applicability, derivation outcome, rule count, termination, and completeness marker. A selected judgment records the exact prefix that justified selection; a `not_derived` judgment records the exhausted rule set. Invalid or ambiguous precedence remains a contract violation rather than falling back to declaration order.

The canonical PHP expression precedence relation now lives in `types/upstream/scannerAstExpressionCandidateInterface.ts` as `SCANNER_AST_EXPRESSION_PRECEDENCE`. The scanner runtime supplies language-specific syntax handlers and candidate evidence but no longer constructs the precedence chain.

## Scope and non-claims

This does not claim that all semantic reasoning has been removed from `compiler/scanner`. Rule handlers still construct PHP AST nodes and require continued ownership auditing. The proof establishes the decision algebra's execution trace under the declared policy; it does not prove that each language-specific handler implements PHP semantics correctly.

## Verification

- `scripts/audits/audit-phase1557-semantic-decision-proof-interface.cjs`: 8/8 static checks.
- Targeted TypeScript compile of upstream decision interface/algebra and candidate policy: passed.
- Targeted runtime checks: selected proof prefix, exhausted no-match proof, and ambiguous-precedence rejection passed.
- Full monorepo build and Vitest suite: not run; project dependencies are absent from this workspace.
