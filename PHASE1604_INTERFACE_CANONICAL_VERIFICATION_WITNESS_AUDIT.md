# Phase 1604 — Canonical Verification Witness Audit

## Scope

Interface-first changes are limited to `packages/core/src/types/upstream/` plus this audit record. Scanner wiring, semantic producers, and runtime executors are intentionally unchanged.

## Finding

Phase 1603 added `verificationBinding.result` while the existing discriminated authority decision proof already carried the authoritative verification result in `premises.verification`. That duplicated one semantic witness in two value paths and allowed the two values to disagree.

## Contract change

- Added `RequestTypeDerivationSemanticVerificationBindingFor<TContract, TInference>` containing only `contract` and `inference` correlation fields.
- Changed `RequestTypeDerivationSemanticAuthorityProofFor` so `verificationBinding` carries only that correlation witness.
- Kept the discriminated `premises.verification` as the sole verification-result value, preserving the existing rule-specific proof shape and its conclusion correlation.
- Added a focused type-contract test asserting that the binding has exactly the `contract` and `inference` keys, has no `result`, and preserves the generic inference type through the candidate boundary.

## Limits

Type-level correlation does not establish runtime object identity or value equality. A future semantic assembler/authority implementation must still verify that the binding's contract and inference correspond to the canonical proof premises. No implementation or wiring changes are included in this phase.

## Verification

- Source-level structural checks: run as part of archive preparation.
- ZIP integrity: `unzip -t` must pass.
- TypeScript, Vitest, and package build: not run because this workspace has no installed local compiler/test/build binaries.
