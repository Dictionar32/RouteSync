# Phase 1622 — Interface-first inference-bound decision proof

## Scope

This phase changes only `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` plus this audit and phase note. It does not modify scanner code, wiring, semantic implementation/algebra, AST interface, or runtime executor.

## Trace finding

`RequestTypeDerivationSemanticInferenceFor<TContract>` already carries the invocation input and judgment. However, the generic `RequestTypeDerivationSemanticAuthorityProofFor<TContract, TInference>` previously retained the non-generic `RequestTypeAuthorityDecisionProof` premises and added the generic inference packet only in `verificationBinding`. That allowed a specialized inference packet to sit beside decision-proof premises whose `input` and `judgment` were typed independently. Runtime integrity checks were still required, but the interface did not express this correlation as strongly as it could.

## Contract change

A distributive `RequestTypeDerivationDecisionProofBoundToInference` type now preserves each decision proof variant and its conclusion/verification relationship while binding its `premises.input` and `premises.judgment` to `TInference['input']` and `TInference['judgment']`. The contract-family coverage and verification-binding witnesses remain in place. This strengthens the type contract without moving reasoning into the interface or introducing new runtime behavior.

## Boundary preserved

- Semantic reasoning remains responsible for deriving the judgment.
- Proof verification remains responsible for checking the judgment and laws.
- Authority remains responsible for adjudicating the closed proof.
- Scanner/wiring and runtime executor are unchanged in this phase.
- The type-level binding cannot prove runtime object identity or value equality; existing integrity validation remains necessary at trust boundaries.

## Validation

Run `node scripts/audits/audit-phase1622-interface-first-inference-bound-decision-proof.cjs`.

A focused strict TypeScript invocation was attempted. It exited with existing diagnostics in unrelated upstream/domain modules; no diagnostic named `requestTypeDerivationInterface.ts` appeared. This is not a clean repository typecheck. Vitest availability and a full build were not established in this phase.
