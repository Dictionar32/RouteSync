# Phase 3010 changelog

- Replaced exported `invocationSemanticRulePolicy(ruleId)` callable with typed operation object `invocationSemanticRulePolicy.resolve(ruleId)`.
- Replaced exported `invocationWitnessOwnerRuleId(witness)` helper with typed operation object `invocationSemanticWitnessOwnership.ownerOf(witness)`.
- Migrated invocation semantic algebra and authority call sites to the named operations.
- Added repeatable structural audit and syntax-transpile result artifacts.
- Preserved CLI manifest request factory and operational input ADT from Phase 3009.
- Kept `collections.ts` whitespace-only and did not restore deleted relation foundation modules.
- Full typecheck, tests, and Laravel CLI E2E remain unverified.
