# Phase 1457 — Semantic Decision Applicability Contract

## Trace

`Source token evidence → candidate applicability → semantic derivation → closed judgment → runtime AST projection → downstream AST`

## Finding

The semantic decision algebra already checked each rule's `applies` judgment before calling `derive`, but the AST runtime registered every expression rule with `alwaysApplicable`. That erased the intended candidate gate and caused eager derivation attempts. Candidate discovery is now moved into `scannerAstExpressionCandidateContractAlgebra`; the runtime receives candidate IDs and only wires those IDs to existing AST derivations.

## Changes

- Added `ScannerExpressionCandidateInterface` and `scannerAstExpressionCandidateContractAlgebra` as the source-evidence boundary for expression candidate discovery.
- Candidate judgments preserve token evidence for `match`, closure, arrow, `instanceof`, casts, parenthesized expressions, assignment, arrays, class references, construction, static calls, and member access.
- The compound-expression rule remains an explicit structural fallback candidate.
- Runtime wiring consumes the candidate judgment and does not reimplement syntax predicates per AST rule.
- The semantic decision algebra validates that every rule has callable `applies` and `derive` members before evaluating any rule.
- Invalid rule contracts produce the closed `contract_violation: invalid_rule_contract` judgment.
- Added tests for candidate discovery, top-level operator evidence, applicability short-circuiting, malformed rule-contract rejection, and priority ordering.

## Contract invariants

1. An inapplicable rule is never derived.
2. Rule metadata is validated before semantic callbacks execute.
3. Declared priority, not declaration order, controls applicable candidates.
4. The upstream candidate algebra owns candidate eligibility; runtime wiring only connects candidate IDs to AST derivations.
5. Malformed evidence is not converted into a successful judgment. Candidate gates may decline a rule when its syntax is not present, allowing the appropriate structural rule to own malformed-input diagnosis.

## Verification boundary

The audit checks structural ownership and contract gates. Focused TypeScript checks and runtime probes must be reported separately. Full build/downstream AST verification remains blocked if the workspace does not have the configured build/test executables or if unrelated transitive type errors remain.
