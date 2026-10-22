# Phase 1567 — Typed Input Rejection Contract

## Model change

`invalid_input` is no longer a judgment carrying only a reason string. It now carries a typed rejection witness:

- duplicate route/resource/request identities use non-empty key ledgers from the matching source domain;
- invalid contract rejection identifies the expected contract kind and the failed law;
- unsupported policy rejection identifies the supported policy kind and the failed law.

The reason is correlated with its evidence through a discriminated union, preventing a `duplicate_source_identity` reason from being paired with an unrelated contract witness.

## Verification semantics

`rejection_confirmed` is distinct from `valid`. A rejected source input is not a successful derivation and should not be represented as a proof-bearing result. The verifier contract can confirm that the rejection evidence corresponds to the source input, or return a law-bound `input_rejection_evidence_mismatch` counterexample.

## Architectural boundary

This phase changes the upstream type contract, its audit, and this note only. It intentionally does not change the request scanner, group aggregator, semantic authority implementation, or runtime executor. The next step is to implement authority behavior that constructs and verifies these witnesses from actual source facts before scanner wiring changes.

## Validation scope

The phase audit checks the shape of the contract and its exports. It is not a full TypeScript build, package build, runtime test, or Vitest result.
