# Phase 1653 — Invocation Semantic Model (Interface First)

## Purpose

Raise the invocation boundary above a collection of rule-ID conditionals. The upstream interface owns the semantic policies that determine which source evidence participates in a judgment, which obligation a derived witness means, which rule owns that obligation, and how closure is summarized. The scanner remains a caller of the runtime executor.

## Canonical ownership

- `invocationSemanticJudgmentInterface.ts` owns the judgment contract, executable relation rules, rule policies, and obligation policies.
- `invocationSemanticJudgmentAlgebra.ts` interprets the declarative contract and projects solver witnesses into typed invocation judgments.
- `invocationSemanticJudgmentAuthority.ts` validates the output against identity, proof, obligation, and closure invariants.
- `invocationSemanticRuntimeExecutor.ts` delegates to the authority.
- `controllerDataflowAnalyzer.ts` supplies produced semantic knowledge and invokes the executor; it does not define invocation policy.

## Phase 1653 changes

1. Contract version advanced from 8 to 9.
2. Added `InvocationSemanticRulePolicy` and `INVOCATION_SEMANTIC_RULE_POLICIES`. Evidence provenance selection and obligation ownership are declarative and keyed by policy, not a `switch(ruleId)`.
3. Added `InvocationSemanticObligationPolicy` and `INVOCATION_SEMANTIC_OBLIGATION_POLICIES`. Obligation-producing relation witnesses and their owning rules are declared in the interface. The algebra projects those witnesses into the existing discriminated obligation union.
4. Trace evidence projection is now interpreted by semantic selector. Trace obligations are selected by declared policy. Rule applications continue to come from actual relation-engine derivations.
5. Scanner/executor wiring and the existing invocation judgment shape are retained to avoid introducing a duplicate authority or a second callable abstraction.

## Verification

- `audit-phase1652-invocation-declarative-rule-engine.cjs`: 15 checks pass.
- `audit-phase1653-invocation-semantic-model.cjs`: 10 checks pass.
- Focused strict TypeScript check with TypeScript 5.8.3 over the invocation interface, algebra, authority, and executor passes.
- `npm run build` cannot run in this workspace because `tsdown` is not installed (`sh: tsdown: not found`). Vitest is not installed, so the full test suite has not been executed.

## Remaining boundary

The algebra still materializes typed domain values from generic relation facts, and `obligationsFor` dispatches on the declared projection shape. This is projection/interpretation logic, not scanner logic, but it is not proof that the entire invocation model has been lowered from a single high-level semantic DSL. A later change should only replace the relation-level catalog after a generic semantic-model compiler can preserve rule witnesses, negative premises, closure semantics, and typed obligation provenance without embedding invocation-specific branches in the generic engine.
