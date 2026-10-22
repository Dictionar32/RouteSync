# Phase 2674 — Conflict inventory closure

## Root cause

The Phase 2673 verifier independently checked identity-collision witnesses and preserved group receipts, but it did not require the conflict proof's route/resource/request receipt arrays to cover the canonical source inventory exactly once. A conflict proof could therefore omit or duplicate a non-collision receipt while retaining a valid collision witness.

## Implementation

- Added `RequestTypeDerivationConflictLedgerClosureVerificationInterface` in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`.
- Added `requestTypeDerivationConflictLedgerClosureMatchesInput` in `requestTypeDerivationProofVerifier.ts`.
- The verifier now requires exact inventory cardinality, unique occurrence keys, source-reference equality, and per-route equality with the authoritative request/resource resolution ledgers before accepting a conflict judgment.
- Added regression cases for dropped and duplicated resource receipts.
- Registered `audit:phase2674-conflict-inventory-closure`.

## Pipeline boundary

CLI `scan` continues to consume the assembled composition's `requestTypeDerivationPipeline`. The fixture manifest is structurally checked, but this phase does not claim a successful runtime scan or manifest write.

## Verification limits

The phase audit is structural only. Vitest, full TypeScript checking, Laravel runtime integration, scan/sync end-to-end equivalence, and all 34 semantic laws remain unverified until dependencies and the Laravel fixture runtime are available.
