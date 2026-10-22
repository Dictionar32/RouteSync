# Phase 1652 — Invocation Declarative Rule Engine

## Intent

The previous callable-boundary phase made the scanner delegate through the executor, but the invocation algebra still performed target ambiguity, positional binding, emission projection, and missing-target decisions imperatively. Phase 1652 replaces those decision branches with executable relation programs owned by `core/src/types/upstream/invocationSemanticJudgmentInterface.ts`.

## Model changes

- Invocation semantic contract is now version 8.
- `INVOCATION_SEMANTIC_EXECUTION_RULES` declares executable relation rules for evidence presence, target resolution, target ambiguity, positional argument binding, missing parameter binding, result emission, exception emission, and unresolved target.
- Rules are compiled through the generic `compileSemanticJudgmentRule` and executed by the existing generic semantic relation engine. No invocation-specific branch was added to the relation engine.
- The algebra now encodes scoped typed source knowledge as relation facts and projects the solver's judgment. Target ambiguity, argument matching, emission selection, and unresolved-target obligations are derived by relation rules, not by `if`/filter decisions in the algebra.
- Single-invocation derivation scopes data-flow to the requested invocation, callable knowledge to target identities, and emission knowledge to those callables before running the solver.
- Trace applications are taken from actual `state.judgment.derivations`, including premise witnesses, bindings, and conclusions. The closure summary is explicitly distinguished from executable relation applications.
- Authority validation checks the exact executable rule trace catalog, identity, obligations, and closure before returning the judgment.
- The scanner continues to call `invocationSemanticRuntimeExecutor.executeAll(...)`; it does not resolve targets or bind arguments.
- No `semantic/foundation` imports were introduced.

## Runtime smoke checks

Executed against the real PHP scanner/data-flow producer and the current semantic relation engine using a temporary typed fixture:

| Scenario | Result |
|---|---|
| Invocation present, no callable target | `incomplete`; `callable_target_unresolved`; actual unresolved-target rule application present |
| One known callable, one matching parameter, result emission | `closed`; one target, one binding, one result flow |
| Two distinct callable targets | `incomplete`; `callable_target_ambiguous` |
| Invocation has an argument with no corresponding parameter | `incomplete`; `argument_parameter_unresolved` |
| Requested invocation absent from semantic knowledge | `incomplete`; `invocation_evidence_missing` |
| Authority validation for closed, ambiguous, and missing-evidence judgments | Passed; each trace contains nine entries (eight executable rules plus closure summary) |

## Audits and verification

- `node scripts/audits/audit-phase1652-invocation-declarative-rule-engine.cjs`: 13/13 checks passed.
- `node scripts/audits/audit-phase1651-invocation-callable-boundary.cjs`: 10/10 checks passed.
- Focused strict TypeScript check for the modified invocation interface, algebra, authority, and executor with `noUncheckedIndexedAccess=false`: passed with zero diagnostics.
- Focused strict TypeScript check with the repository's `noUncheckedIndexedAccess=true`: 59 diagnostics in transitive relational substrate/dependency files; zero diagnostics in the modified invocation interface, algebra, authority, and executor.
- `npm run build`: blocked because `tsdown` is not installed in this workspace (`sh: tsdown: not found`). This is not reported as a successful build.
- Vitest is not installed in the workspace, so the automated test suite was not run. A scanner test assertion was updated to verify the executable trace catalog and an actual unresolved-target derivation witness.

## Remaining boundary

The algebra still performs projection from derived relation facts into domain-shaped TypeScript values and assembles the closure certificate. Those are boundary/projection duties, not invocation target/binding/emission inference. The generic engine remains domain-neutral.
