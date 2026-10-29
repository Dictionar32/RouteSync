# Phase 1655 — Invocation Semantic Model / Interface-First Runtime

## Architectural change

Invocation rules are no longer assembled by `invocationSemanticModelCompiler.ts`. The invocation interface owns one authoritative `InvocationSemanticModel` whose judgment laws use reusable semantic concepts: evidence presence, evidence-backed identity, uniqueness, ordered correspondence, effect projection, and absence obligations.

`semanticJudgmentRuleCompiler.ts` lowers those reusable laws into the generic derivation representation. It has no invocation- or callable-specific branches. Compatibility rule exports are projections from the model rather than a second hand-maintained executable catalog.

## Runtime flow

```text
PHP AST / upstream semantic facts
    -> SemanticKnowledgeDataFlow
    -> invocationSemanticRuntimeExecutor.executeAll(...)
    -> invocationSemanticAuthority
    -> generic semantic-law compiler + relation authority
    -> proof-carrying invocation judgment
    -> scanner compatibility projection
```

The scanner remains a delegator. The runtime executor remains wiring only. The upstream authority validates request identity, declared trace coverage, obligation witnesses, and closure before exposing a judgment.

## Files changed

- `packages/core/src/types/upstream/semanticJudgmentDerivationInterface.ts`
  - Added the reusable high-level semantic-law model.
- `packages/core/src/types/upstream/semanticJudgmentRuleCompiler.ts`
  - Added domain-neutral lowering from semantic laws to executable derivation rules.
- `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`
  - Upgraded invocation model to version 2 and contract to version 11.
  - Moved executable law ownership into the model.
  - Derived compatibility rule exports from the model.
- `packages/core/src/types/upstream/invocationSemanticModelCompiler.ts`
  - Vacated in place; invocation-specific compiler templates are no longer present.
- `packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts`
  - Clarified the scanner boundary as delegation and projection only.
- `scripts/audits/audit-phase1655-invocation-semantic-model-interface-first.cjs`
  - Added architecture audit for model ownership, generic lowering, scanner wiring, and executor purity.

## Verification

The focused strict TypeScript check passed for the new semantic-law contracts, generic compiler, and invocation interface. The compiled model smoke check produced the expected eight execution rule IDs from seven high-level laws. A full repository TypeScript build is not claimed: the workspace has no installed project dependencies and the global TypeScript compiler is 5.8.3, while this project requests TypeScript 7.0.2; the attempted repository check also exposes unrelated existing type errors.
