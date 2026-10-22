# Phase 2036 — Assignment AST Judgment Boundary, Interface First

## Trace finding

The upstream `ScannerAssignmentPartsInterface` already returned a closed `AssignmentPartsJudgment`, but the AST runtime immediately wrapped assignment-expression results in `RelationOption`. The simple-statement assignment rule did the same. This made the rule-algebra boundary weaker than the upstream judgment and required the AST policy to reinterpret a judgment through a legacy absence representation.

## Change

- `classifyAssignmentExpression` now returns the existing `AstRuleResolution` contract directly.
- The assignment expression rule uses its judgment resolver path, preserving `malformed` and `rule_contract_violation` as terminal AST-rule outcomes.
- The simple-statement assignment rule now uses `classifyAssignmentStatementJudgment` directly.
- Assignment source failures retain the original `AssignmentPartsJudgment` in `ScannerAstSourceFailureJudgment`.
- The `RelationOption` wrapper remains only for the counted-for-clause compatibility consumer; it is not used by the canonical expression or simple-statement assignment rule.
- No second authority and no relation/foundation subscanner were added. Laravel invocation semantic judgment and integrated-response wiring were left intact.

## Boundary

This phase does not claim that `astClassifierRuntime.ts` is fully relation-free. Many unrelated expression and statement recognizers still use the compatibility adapter. The narrower, verified claim is that the canonical assignment expression and simple-statement rule boundaries consume the existing upstream judgment directly.

## Verification

Run `npm run audit:phase2036-assignment-ast-judgment-boundary-interface-first` and the adjacent phase audits. Full TypeScript build/type-check is intentionally not represented as having run in this phase.
