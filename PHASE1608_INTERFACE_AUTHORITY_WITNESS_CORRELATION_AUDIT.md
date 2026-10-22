# Phase 1608 — Interface Authority Witness Correlation Audit

## Scope

Interface-first only. This phase adds a typed contract for checking runtime correlation of the existing authority candidate and verification envelope. It does not implement the validator and does not change scanner wiring or runtime executor behavior.

## Change

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`
  - Added `RequestTypeDerivationSemanticAuthorityIntegrityViolation`.
  - Added the closed `RequestTypeDerivationSemanticAuthorityIntegrityResult<TContract, TInference>` union.
  - Added `RequestTypeDerivationSemanticAuthorityIntegrityInterface<TContract, TInference>`.
- `packages/core/src/types/upstream/__test__/requestTypeDerivationAuthorityIntegrityInterface.phase1608.test.ts`
  - Checks candidate/envelope typing, closed result shape, and inference generic preservation.

## Contract obligations

An implementation must compare the candidate and verification envelope against the same contract policy, and must reject correlation failures for the inference packet, source input, judgment, or verification result. It may only validate existing witnesses; it must not infer a replacement judgment, reclassify the source, or repair a proof. Object witness identity must be preserved. Contract value compatibility must be explicit and consistent with the contract's equality semantics.

## Verification status

- Structural source checks: passed (violation union, closed result union, generic-bound validator signature, focused test presence, and interface-only scope).
- TypeScript/Vitest/build: not run in this phase.
- Scanner wiring and runtime executor: untouched by this phase.
- ZIP layout and integrity: to be checked before delivery.

## Boundary

This phase defines the interface contract only. It does not claim runtime enforcement until an implementation is connected in a later, explicitly authorized wiring phase and its behavior is tested.
