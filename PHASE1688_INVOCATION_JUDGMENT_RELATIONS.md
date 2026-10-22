# Phase 1688 — Invocation Semantic Judgment Relations

## Intent

Elevate the invocation semantic model beyond descriptive rule names. Every rule now participates in an exhaustive typed relation connecting its semantic prerequisite, established domain fact, non-conclusion, obligation meaning, witness meaning, and trace-policy owner.

## Interface/model changes

- Added `InvocationSemanticEstablishedFact` as the domain vocabulary for what a rule may establish.
- Added `InvocationSemanticRulePrerequisite` as the domain vocabulary for the evidence/semantic conditions required before a rule can contribute a fact.
- Added `InvocationSemanticRuleJudgmentRelationFor<RuleId>`, `InvocationSemanticRuleJudgmentRelation`, and the exhaustive `InvocationSemanticRuleJudgmentRelationCatalog`.
- Added `INVOCATION_SEMANTIC_RULE_JUDGMENT_RELATIONS` with explicit relations for all nine execution rules and the closure rule.
- Integrated the relation catalog into `InvocationSemanticModel` as `ruleJudgmentRelations`.
- Added `judgmentRelationAuthority` to `InvocationSemanticPipelineContract` to declare that prerequisites, facts, non-conclusions, obligations, witnesses, and trace ownership must correlate.
- Advanced model version 18 → 19, invocation contract version 32 → 33, and pipeline contract version 9 → 10.
- Exported the relation catalog and domain types from the public package entry point. The upstream barrel already exports the judgment interface module.

## Scope boundaries

This phase is interface/model-first. It does not modify scanner wiring, authority implementation, algebra implementation, or runtime executor implementation. The scanner remains on its existing aggregate delegation path. The new relation catalog establishes the intended semantic authority model; it does not by itself prove that runtime validation already enforces every relation. Enforcing this catalog against actual judgment outputs belongs to a later phase after the interface surface is accepted.

No dependency on `core/src/semantic/foundation` was added. No generic callable boundary or `any` was introduced.

## Verification

- Phase 1680–1688 audits passed (Phase 1688: 10/10).
- Focused TypeScript strict check passed for the pipeline and its contract dependencies.
- Full repository build was not run.

## Design references

- TypeScript structural contracts: https://www.typescriptlang.org/docs/handbook/2/objects
- Discriminated unions and exhaustiveness: https://www.typescriptlang.org/docs/handbook/2/narrowing
