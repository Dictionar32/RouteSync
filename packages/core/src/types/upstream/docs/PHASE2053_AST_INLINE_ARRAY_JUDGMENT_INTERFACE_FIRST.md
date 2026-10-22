# Phase 2053 — AST Inline-Array Judgment, Interface First

## Trace and boundary decision

The current expression path is:

`token source → scannerAstExpressionCandidateContractAlgebra.resolve → AST_CLASSIFICATION_RULES → astClassificationRuleAlgebra.resolveFirst/verifyJudgment → locateAstValue`.

The existing `AstClassificationRuleAlgebraInterface` is already the sole ordered rule-selection and closed-judgment contract. This phase does not add a competing AST authority, relation kernel, foundation subscanner, or another facade.

## Implemented migration

`EXPRESSION_CANDIDATE.inlineArray` used to be marked `legacy_adapter`; its adapter repeated the outer `[` / `]` recognition and converted a `RelationOption<PhpAstValueNode>` into the already-existing `AstRuleResolution` judgment. Applicability is already owned by upstream candidate evidence, so repeating that test inside the resolver was duplicate classification.

The rule now declares `kind: 'judgment'` and returns the result of `classifyInlineArray(input.tokens)` as a resolved rule judgment. The existing candidate contract decides whether the rule applies; the existing rule algebra decides precedence, selection, and proof; the existing AST projector attaches source location. The AST node constructor/parser remains a structural projection step, not a new semantic authority.

This is a narrow migration: it removes one adapter and duplicate applicability check without claiming that every semantic decision inside `classifyInlineArray` has already moved upstream. In particular, array entry partitioning and PHP entry interpretation remain candidates for a future typed evidence/judgment contract; they should be migrated by extending the existing token-structure / expression contract where it truly fits, not by moving callbacks into another file.

## Remaining trace priorities

| Candidate | Current state | Next architectural move |
|---|---|---|
| `closure`, `arrow` | legacy `RelationOption` adapters | introduce/extend a closed closure-expression judgment contract that captures captures, parameters, body/expression, and source span before AST projection |
| `instanceof` | context adapter discovers operator occurrence then calls legacy classifier | make operator occurrence a required typed candidate witness and let a closed judgment consume that witness |
| `parenthesized` | legacy option adapter | typed delimiter/inner-expression judgment; preserve unsupported/malformed distinction |
| `classConstant`, `classReference` | legacy option adapters | closed name-expression judgments, keeping PHP name resolution separate from syntax projection |
| `construct`, `staticCall`, `member` | legacy option adapters | closed invocation/member-access judgments, with target and arguments represented as typed evidence |
| inline-array entry semantics | direct rule judgment now, inner helper still performs structure/entry projection | contract for top-level partitions and keyed/positional/unpacked entry evidence; no guessing on malformed input |

## Cross-domain invariant

The Laravel controller scanner continues to use the existing invocation semantic judgment and integrated response pipeline. Response-attribute inference continues to use the Phase 2052 upstream semantic judgment authority. Runtime code must execute already-closed judgments; it must not introduce a second invocation or response owner. The Phase 2051 and 2052 audits are retained as regression gates.

## Validation scope

The Phase 2053 audit verifies the direct judgment path, candidate applicability ownership, preservation of the existing rule algebra, projection boundary, remaining adapter inventory, and regression-audit registrations. Structural audits are not a substitute for TypeScript typecheck or Vitest; those are not claimed as run in this environment.
