# Phase 2027 — Preserve malformed AST judgments across the rule algebra

## Root cause

`ScannerMatchExpressionJudgment` and `ScannerCastExpressionJudgment` already distinguish malformed source from non-applicability. The old AST runtime adapter erased that distinction: match malformed was returned as `RelationOption.none`, which allowed the policy to continue and eventually project `unsupported`. Cast malformed instead threw immediately. This inconsistency meant equivalent source failures crossed the same AST policy through different control paths.

## Change

The existing `AstClassificationRuleAlgebraInterface` now carries generic failure evidence in its rule resolution and closed judgment ADTs. `malformed` and `rule_contract_violation` are terminal outcomes with the originating rule identity and complete ordered attempts. `verifyJudgment` checks their attempt history, not only successful resolution.

`classifyMatch` and `classifyCast` now map their existing upstream scanner judgments directly into those closed outcomes. The runtime raises `AstClassificationFailureError` with the exact closed judgment attached when the existing public API must return `PhpAstValue` and cannot return a failure ADT directly. Malformed match expressions can no longer silently degrade into `unsupported`.

## Scope limits

This phase does not remove `RelationOption` from every AST parser helper. It removes outcome loss for match/cast grammar judgments and makes the rule algebra capable of carrying typed failures. The compatibility adapter remains for older parser recognizers. No relation/foundation subscanner or parallel semantic authority was added.

## Laravel continuity

The existing four-outcome Laravel invocation judgment remains canonical. Controller scanner wiring continues forwarding the exact invocation and response judgments to AST projection. The runtime executor remains a thin delegate to the upstream authority.

## References

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- TypeScript discriminated unions and exhaustive checking: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
