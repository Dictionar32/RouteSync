# Phase 1690 — Declarative Invocation Trace Contract

## Why this change exists

The prior `InvocationSemanticTraceOutcomeFor` and `InvocationSemanticWitnessForRule` used nested conditional types (`RuleId extends ... ? ...`). Those are type-level decision trees. They encode rule dispatch as branching logic inside the type definition, which conflicts with the goal of a declarative semantic model.

## What changed

- Replaced conditional rule dispatch with `InvocationSemanticTraceRuleContractCatalog`, a closed keyed domain contract.
- Each rule directly declares its allowed trace outcomes and witness family.
- Outcome and witness types are indexed projections of the declared rule contract; they do not select a branch through conditional types.
- The judgment model version advanced from 19 to 20.
- The invocation semantic contract advanced from 34 to 35.
- The judgment trace contract advanced from 2 to 3.
- The pipeline contract advanced from 11 to 12.
- Added Phase 1690 static audit and exported the catalog type publicly.
- Updated historical static audit expectations to match the current canonical contract versions and declarative model.

## Example of the design shift

Before: `RuleId extends 'invocation-judgment-closure' ? 'closed' | 'incomplete' : ...`

After: the `'invocation-judgment-closure'` entry declares `outcomes: readonly ['closed', 'incomplete']`; the trace type projects `InvocationSemanticTraceRuleContractCatalog[RuleId]['outcomes'][number]`.

## Scope and limitation

This phase removes type-level conditional dispatch from the trace contract. It does **not** claim that every existing semantic description in the wider invocation model has been eliminated; fields such as rule questions and prerequisites still need a deliberate model-level review if the goal is to make domain facts and judgment variants—not rule-by-rule reasoning metadata—the canonical semantic authority. Scanner wiring and runtime implementation are unchanged in this interface-first phase.

## Verification

- Phase 1680–1690 focused audits pass.
- Focused TypeScript strict check passes for the affected upstream interface modules.
- Full repository build was not run.
