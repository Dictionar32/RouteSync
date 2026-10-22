# Phase 1574 — Interface-first verified authority outcome

## Architectural finding

The prior interface exposed `derive(input): RequestTypeDerivationJudgment` and a separate `verify(input, judgment)`. That allowed a consumer to call `derive` and consume the judgment without ever observing verification. The proof and exhaustive law coverage existed in the model, but the public authority boundary did not couple the produced judgment to the verifier result.

## Model change

File changed: `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`.

- Added `RequestTypeDerivationAuthorityOutcome` with three explicit states:
  - `verified`: non-rejected judgment paired with a successful exhaustive-law verification.
  - `input_rejected`: invalid-input judgment paired with confirmed typed rejection.
  - `verification_failed`: non-rejected judgment paired with a law-specific counterexample.
- Changed `RequestTypeDerivationAuthorityInterface.derive` to return the coupled outcome rather than a bare judgment.
- Retained `verify` for independent audit and tests, while the primary derive boundary no longer permits a caller to silently skip verification.
- Preserved exhaustive law coverage and domain-correlated duplicate-location evidence.

This makes the interface express the required trust transition: raw input -> authority judgment -> verification -> consumer-visible outcome. It does not prove that an implementation is honest or that verification logic exists. The repository still has no implementation/consumer of `RequestTypeDerivationAuthorityInterface` under `packages/core/src`; that is a separate migration frontier.

## Trace frontier

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`: modified.
- `packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts`: intentionally unchanged; still returns a bare `readonly RequestType[]`.
- `packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts`: intentionally unchanged; request lookup, resource grouping, action merge, and response selection remain local semantic decisions.
- `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts`: intentionally unchanged; it belongs to a distinct semantic type-derivation authority boundary.

## Validation

- `node scripts/audits/audit-phase1574-verified-authority-outcome-contract.cjs`: 10/10 structural checks passed.
- `node scripts/audits/audit-phase1573-exhaustive-law-coverage-contract.cjs`: rerun after updating its authority-boundary assertion.
- Phase 1572 duplicate evidence audit: run as regression check.
- TypeScript full build and Vitest are not claimed; dependencies are not installed in this workspace. Static audits are structural checks, not semantic proof.

## Research grounding

MLIR's official interface documentation describes interfaces as a generic boundary so analyses/transforms depend on behavior rather than specific implementation details: https://mlir.llvm.org/docs/Interfaces/ . TypeScript's mapped types document explains deriving required keys from a union, useful for exhaustive law coverage: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html . These references inform the design; they do not certify this repository's implementation.

## Required order

`source evidence -> semantic authority/verifier -> coupled verified outcome -> scanner wiring -> runtime executor simplification`.
