# Phase 1603 — Authority Verification Binding Audit

## Scope

Interface-first change limited to `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`, a focused type-contract test, and this audit. Scanner wiring, implementation/producer code, runtime executor, and downstream projections are unchanged.

## Gap addressed

Phase 1602 introduced an inference-bound verification envelope at the verifier and decision-premise boundary, but the contract-bound authority proof did not expose that envelope. The proof could therefore lose the explicit source-to-verification association at the authority boundary even though the earlier interface had it.

`RequestTypeDerivationSemanticAuthorityProofFor<TContract, TInference>` now requires `verificationBinding: RequestTypeDerivationSemanticVerificationFor<TContract, TInference>`. `RequestTypeDerivationSemanticAuthorityCandidateFor` carries the same inference generic into its proof. The semantic decision capability's generic return type now preserves the concrete inference type through the candidate boundary.

## Contract implications

- The authority proof must preserve the verification envelope instead of dropping it at the authority boundary.
- The candidate's contract family and inference packet are represented by the same generic parameters.
- This is an interface contract, not proof that existing implementations satisfy it; those implementations will require migration before this interface can be considered wired and build-ready.
- TypeScript structural typing cannot guarantee runtime object identity or that `verificationBinding.result` matches the legacy `premises.verification` field. A future semantic assembler must preserve the same packet and reconcile/remove the transitional duplicated result field in the proof algebra. Runtime must not reconstruct semantic meaning.

## Validation

- Structural inspection and archive integrity checks are performed.
- TypeScript type-check, Vitest, and package build are not claimed as passing; the workspace's local executables were unavailable in the previous phase and have not been installed for this interface-only phase.
