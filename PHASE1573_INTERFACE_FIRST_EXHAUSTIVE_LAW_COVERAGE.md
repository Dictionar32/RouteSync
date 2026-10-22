# Phase 1573 — Interface-first exhaustive law coverage

## Decision

Strengthen the existing `RequestTypeDerivationAuthorityInterface` contract before implementing or modifying runtime execution. The contract's prior `laws: readonly RequestTypeDerivationLawId[]` admitted a partial list at the type boundary. A verification result of `{ kind: 'valid', proofKind: ... }` also did not state which laws were checked, or require exhaustive coverage.

## Model change

File changed: `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`.

- `RequestTypeDerivationRequiredLawCoverage` is a mapped record over every `RequestTypeDerivationLawId`, with each law marked `required`.
- `RequestTypeDerivationVerifiedLawCoverage` is a mapped record over every `RequestTypeDerivationLawId`, with each law marked `verified`.
- `RequestTypeDerivationContract.laws` now requires exhaustive required-law coverage rather than a freely partial array.
- `RequestTypeDerivationProof.laws` now requires exhaustive verified-law coverage.
- A `kind: 'valid'` verification result must include `verifiedLaws` with exhaustive verified-law coverage.

This is a type-level contract for exhaustiveness, not a claim that TypeScript proves the truth of each semantic law. The authority implementation must actually establish each law from source evidence; a value can still lie if constructed unsafely or produced by incorrect code.

## Trace frontier

- `packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts` still returns `readonly RequestType[]` and does not consume `RequestTypeDerivationAuthorityInterface`.
- `packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts` still owns request lookup, resource grouping, action merge, and response selection. These are semantic decisions that should move behind the authority contract before scanner wiring is simplified.
- `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts` delegates to `SemanticTypeDerivationAuthorityInterface`, a separate authority. It was intentionally left unchanged; RequestType derivation and semantic type derivation must not be conflated.
- Repository search found no implementation or consumer of `RequestTypeDerivationAuthorityInterface` under `packages/core/src`. Thus the next architectural step is an authority/verifier implementation and law tests, not an executor refactor.

## Validation

- `node scripts/audits/audit-phase1573-exhaustive-law-coverage-contract.cjs`: 12/12 structural checks passed; the law union currently contains 32 unique identifiers.
- Phase 1572 duplicate-counterexample audit: 11/11 passed. Phase 1571 duplicate-pair audit was refreshed to match the domain-correlated types introduced in Phase 1572 and passes 10/10.
- The audit is textual/static and is not a semantic proof.
- Full build and Vitest are not claimed unless executed successfully in this workspace.

## Research grounding

MLIR documents interfaces as a generic way for analyses and transformations to consume behavior without hard-coding each operation or dialect: https://mlir.llvm.org/docs/Interfaces/ . TypeScript documents discriminated unions and exhaustive narrowing, including `never`, as ways to make missing cases visible to the type checker: https://www.typescriptlang.org/docs/handbook/2/narrowing.html . These are design references, not evidence that this RouteSync contract is already implemented correctly.

## Required order

`source evidence → semantic law authority/verifier → closed judgment and exhaustive proof → scanner wiring → runtime executor simplification`.
