# Phase 1599 — Interface Contract Closure

## Scope

This phase stays inside the interface-first boundary. It changes the request-type derivation upstream contract and adds a type-level test. It does not implement a producer, proof verifier, assembler, scanner wiring, or runtime executor.

## Contract change

`RequestTypeDerivationSemanticAuthorityCandidateFor<TContract>` previously bound the outer candidate envelope to `TContract`, while its nested `proof` used the non-parameterized `RequestTypeDerivationSemanticAuthorityCandidate` alias. That left the proof's coverage witness less explicit than the envelope's contract family.

The new `RequestTypeDerivationSemanticAuthorityProofFor<TContract>` preserves the existing closed decision-proof shape while intersecting its premises with `RequestTypeAuthorityCoverageEvidenceFor<TContract>`. The candidate now uses that contract-bound proof alias. This strengthens the type boundary; runtime equality of contract values still has to be enforced by the future assembler/authority implementation.

## Files changed

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
- `packages/core/src/types/upstream/__test__/requestTypeDerivationProofContractBinding.phase1599.test.ts`
- `PHASE1599_INTERFACE_CONTRACT_CLOSURE.md`
- `PHASE1599_INTERFACE_CONTRACT_CLOSURE_AUDIT.json`

## Verification

- Static source inspection confirms the candidate's proof is parameterized by the same contract family as the candidate envelope.
- A targeted `tsc --noEmit` invocation traversed imports and reported existing type errors in unrelated modules. No diagnostics named `requestTypeDerivationInterface.ts` appeared in the captured output, but this is not a successful full compile.
- Vitest and `tsdown` were unavailable in the workspace, so the new type test and package build were not executed.
- No scanner wiring, producer/verifier implementation, or runtime executor source was changed.

## Readiness

Not migration-ready. This phase closes one interface-level contract-binding gap; it does not prove all upstream interfaces are complete, and it does not satisfy the still-missing concrete reasoning, verifier, and pipeline assembler implementations.
