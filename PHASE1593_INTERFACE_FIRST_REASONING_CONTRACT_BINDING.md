# Phase 1593 — Interface-first semantic reasoning contract binding

## Scope

This phase changes only `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`. It does not modify scanner wiring, runtime execution, solver implementation, or downstream projection.

## Contract change

`RequestTypeDerivationSemanticReasoningInterface` is now parameterized by the exact `RequestTypeDerivationContract` type and exposes that contract as a required member. `RequestTypeDerivationSemanticPipelineInterface<TContract>` binds its reasoning capability to `RequestTypeDerivationSemanticReasoningInterface<TContract>`, matching the existing verifier and authority generic binding.

## Why

Previously the pipeline declared a contract, a verifier bound to that contract type, and an authority bound to that contract type, but its reasoning capability had no contract member. The interface therefore allowed the semantic reasoning capability to be described without declaring which policy/law contract governs its inference. This phase closes that interface-level omission.

## Invariant established

A pipeline's declared reasoning, verification, and authority capabilities all expose the same contract type parameter `TContract`. This is a compile-time compatibility constraint, not proof of runtime object identity or semantic correctness; implementation and verification audits are still required before cutover.

## Deliberately not done

- No scanner or CLI wiring changes.
- No solver migration or replacement.
- No claim that a concrete proof-producing implementation now exists.
- No claim that build or tests passed.

## Next gate

Before wiring migration, implement and test a concrete reasoning producer and verifier that satisfy this contract, then prove the pipeline's runtime contract/policy alignment and verify the full source-to-projection path.
