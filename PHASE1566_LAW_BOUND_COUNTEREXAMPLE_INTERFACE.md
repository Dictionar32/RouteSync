# Phase 1566 — Law-Bound Counterexample Interface

## Goal

Strengthen the request-type semantic interface before touching authority implementation, scanner wiring, or runtime execution.

## Model gap

Phase 1565 made verifier failures carry typed evidence, but the failure did not identify the semantic law it refuted. A diagnostic could therefore have a typed witness without an explicit contract-level link between the witness and the invariant being checked.

## Interface change

In `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`:

- Every `RequestTypeDerivationVerificationFailure` variant now has a `law` field.
- The `law` field is narrowed to the relevant `RequestTypeDerivationLawId` or a small union of relevant law identifiers for each failure category.
- `authority_policy_matches_contract` was added to the law vocabulary so a policy mismatch is represented as a contract-law violation rather than an unclassified difference.
- The failure retains its existing typed `evidence` payload; law and evidence together form a law-bound counterexample.
- No executable policy constants or scanner/runtime implementation were introduced into the interface.

## Trace boundary

- `RequestTypeDerivationAuthorityInterface` still defines `derive(input) -> RequestTypeDerivationJudgment` and `verify(input, judgment) -> RequestTypeDerivationVerification`.
- `scanner/subscanners/RequestTypeDeriver.ts` and `scanner/subscanners/request-deriver/groupAggregator.ts` are intentionally unchanged.
- `semanticTypeDerivationRuntimeExecutor.ts` is intentionally unchanged.

## Validation

`node scripts/audits/audit-phase1566-law-bound-counterexample-interface.cjs` — 18/18 static checks passed.

This is a static model audit only. It does not prove the semantic authority emits truthful counterexamples, and it does not establish a successful full TypeScript build, package build, or Vitest run.

## Design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — compiler analyses should work through explicit interfaces rather than embedding concrete implementation knowledge in each consumer.
- TypeScript Handbook, Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing — discriminated unions encode distinct states and support exhaustive handling.

These references support the design direction; they are not evidence of RouteSync test success.
