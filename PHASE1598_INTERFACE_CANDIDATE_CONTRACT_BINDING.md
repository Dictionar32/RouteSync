# Phase 1598 — Interface-first candidate contract binding

## Scope

This phase changes only the upstream RequestType derivation interface surface and adds a type-level test. It does not change scanner wiring, runtime execution, semantic reasoning implementation, proof verifier implementation, or pipeline assembly implementation.

## Boundary defect addressed

Before this phase, `RequestTypeDerivationSemanticDecisionInterface<TContract>` returned the non-generic `RequestTypeDerivationSemanticAuthorityCandidate` alias, and `RequestTypeDerivationSemanticAuthorityInterface<TContract>.evaluate` accepted that same unbound proof alias. The `TContract` family therefore disappeared from the candidate boundary between decision and authority, despite the capabilities advertising a shared contract.

## Contract change

- Added `RequestTypeDerivationSemanticAuthorityCandidateFor<TContract>` with explicit `contract` and `proof` fields.
- Decision now returns the contract-bound candidate envelope.
- Authority evaluation now consumes that same contract-bound envelope.
- Runtime contract-value equality remains an implementation obligation; TypeScript structural types alone cannot prove object identity. The interface now preserves the contract value so an implementation can check it instead of reconstructing it from coverage evidence.

## Files changed

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
- `packages/core/src/types/upstream/__test__/requestTypeDerivationCandidateContractInterface.phase1598.test.ts`
- This audit note.

## Verification status

- Static source assertions: run separately during packaging.
- TypeScript/Vitest execution: not run; this workspace has no installed root `node_modules` executables.
- Package build: not verified.
- Migration readiness: **not established**. Concrete reasoning, proof verification, authority decision, and composition still need implementation and independent validation before wiring migration.
