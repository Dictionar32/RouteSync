# Phase 1610 — Interface Source-Input Binding Audit

## Objective

Close the invocation-binding gap in the Phase 1609 integrity contract. A candidate and verification envelope can be mutually correlated yet still belong to an earlier or different source invocation. The integrity boundary therefore needs the expected input as an independent witness.

## Interface-first change

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
  - Changed `RequestTypeDerivationSemanticAuthorityIntegrityInterface.validate` to accept `expectedInput`, `candidate`, and `verification`.
  - Contractually requires the validator to bind the candidate's proof-premise input, inference packet input, and verification envelope to this exact invocation input; input/inference/judgment/verification-result object witnesses retain exact identity.
  - Kept contract-value compatibility governed by the Phase 1609 explicit `contractEquivalence` capability.
- `packages/core/src/types/upstream/__test__/requestTypeDerivationAuthorityIntegrityInterface.phase1608.test.ts`
  - Updated type assertions for the three-argument validator and preserved candidate, verification, and inference generic types.

## Scope boundary

Only the upstream interface, its focused type test, and this audit document differ from Phase 1609. No scanner wiring, runtime executor, inference implementation, or validator implementation was changed. The interface makes the source-binding obligation explicit; it does not claim that a runtime implementation enforces it yet.

## Verification

- Structural assertions must confirm the independent expected-input parameter and all three argument types.
- TypeScript, Vitest, and package build are not claimed unless executed successfully.
- Archive must contain the top-level `RouteSync/` directory and pass `unzip -t`.
