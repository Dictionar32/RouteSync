# Phase 1535 — Interface-first ownership-correlated runtime contract

## Why this phase exists

The previous source-bound envelope attached `evidence`, `decision`, and one `proofStatus` to every outcome. That made an unclaimed operation look as though an owned evaluator had run but failed to emit proof receipts. Ownership and proof state were not correlated in the type model.

## Contract change

`QueryOperationSemanticEvidenceBoundExecution` is now a discriminated union:

- `ownership: 'claimed'` requires a decision that cannot be `not_applicable` and honestly reports `evaluator_obligations_not_yet_emitted`.
- `ownership: 'unclaimed'` requires a `not_applicable` decision and reports `not_applicable_no_executor_invoked`.

The upstream resolver constructs the envelope by branching on the closed decision. The scanner continues to pass the original source span to the upstream interface and treats an upstream `malformed` decision as terminal for that operation; it does not reinterpret that claimed operation through the legacy catalog.

## Architectural effect

This is a stronger contract invariant, not a claim that semantic proof production is complete. The interface now distinguishes three separate questions that must not be conflated:

1. **Ownership:** has a semantic rule claimed the method?
2. **Execution outcome:** did the claimed rule resolve or reject the evidence?
3. **Proof completeness:** has the evaluator emitted and validated every required obligation receipt?

The third remains an explicit migration frontier. The rule catalog currently declares obligations, but the legacy evaluators do not yet emit a complete obligation ledger. Do not mark an outcome proof-complete until that implementation exists.

## Verification status

- Phase 1535 ownership-correlated contract audit: run separately.
- Phase 1534 source-bound interface audit: expected to continue passing.
- Phase 1500 interface-first authority audit: expected to continue passing.
- Legacy Phase 1501–1503 audits are present in the baseline archive but currently fail on existing migration-frontier assertions (missing rule-emission checks / old scanner-delegation expectations). This phase does not claim to repair those unrelated frontiers.
- Full TypeScript build/typecheck is unverified because `tsdown` and `tsc` are not installed in this workspace.

## Next interface-first frontier

Extend the rule declaration from a list of required obligation names into an executable derivation contract whose evaluator returns one receipt per required premise and constraint, anchored to source evidence or a dependent judgment. Validate receipt completeness before a `resolved` conclusion can cross the runtime boundary. Then migrate the rule-family executor table to that contract, wire scanner consumers to the validated judgment, and only then retire the legacy query-operation catalog family by family.
