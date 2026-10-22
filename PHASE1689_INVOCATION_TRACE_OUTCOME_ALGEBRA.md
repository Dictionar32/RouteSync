# Phase 1689 — Invocation Trace Outcome Algebra

## Objective

Strengthen the semantic judgment interface so trace outcomes are constrained by the rule that owns them. This is an interface/model phase; scanner wiring is intentionally unchanged.

## Model changes

- Added `InvocationSemanticTraceOutcomeFor<RuleId>` as a rule-indexed outcome type.
- Only `invocation-judgment-closure` can report `closed` or `incomplete`.
- `invocation-argument-form-evidence` can report `no-conclusion` or `obligation-emitted`, but cannot claim a derivation outcome because this rule owns no derivation witness.
- Added explicit outcome-correlation invariant to the canonical judgment contract and proof-trace contract.
- Advanced `InvocationSemanticContract` from version 33 to 34 and pipeline contract from version 10 to 11; trace contract version 1 to 2.
- Exported the domain outcome type from the public package entrypoint.

## Boundary status

No scanner wiring, authority implementation, algebra implementation, or runtime executor was migrated in this phase. The current scanner path remains a delegation to `invocationSemanticRuntimeExecutor.executeAll(semanticKnowledgeDataFlow)`. The purpose is to make invalid trace meanings unrepresentable at the interface boundary before wiring migration.

## Verification

- Phase 1689 audit: 10/10 checks passed.
- Focused TypeScript strict check: passed.
- Previous phase audit scripts were updated to assert the current contract versions and will be run as a compatibility suite.
- Full repository build was not run.

## Design reference

TypeScript discriminated unions narrow the legal fields and outcomes associated with a literal discriminator and support exhaustiveness checking: [TypeScript Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
