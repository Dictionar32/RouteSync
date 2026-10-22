# Phase 1728 — Analysis-to-Inventory Correspondence Contract

## Trace finding

The Phase 1727 publication result had a `validated-publication` branch carrying a contract reference and a literal invariant label. That describes the intended guarantee, but it does not carry an entry-by-entry correspondence record. The violation union also did not explicitly distinguish malformed inventory entries from duplicated or out-of-inventory ordinary analysis judgments.

## Interface-first changes

Primary files:

- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`
- `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`
- `packages/core/src/index.ts`

Changes:

1. Added `InvocationSemanticCoveragePublicationCorrespondence`, pairing the canonical inventory entry with the exact publication entry that accounts for it.
2. The validated publication receipt now requires a correspondence ledger and states that no analysis judgment may remain unmatched.
3. Added explicit rejection variants for:
   - inventory identity not matching its embedded subject identity;
   - inventory source evidence not matching the embedded subject's source;
   - duplicate ordinary analysis judgments for one subject;
   - ordinary analysis judgments whose subject is absent from the canonical inventory.
4. Added coverage contract invariants for ordinary-analysis correspondence and the entry-by-entry validation receipt.
5. Added a Laravel scanner boundary invariant requiring the scanner to preserve the receipt without reconstructing or asserting validation.
6. Exported the correspondence type through the core public index.
7. Updated historical Phase 1721–1727 audit expectations to the current contract versions, preserving their original invariant checks.

Contract versions:

- `InvocationSemanticCoverageContract`: v21
- `InvocationSemanticPipelineContract`: v37
- `LaravelControllerInvocationSemanticBoundaryContract`: v16

## Scope and limitations

This phase changes contracts only. It does not implement the inventory authority, coverage publication authority, static invocation algebra, static authority, or production Laravel scanner wiring. A correspondence record is auditable typed data; its presence alone does not prove that values match. The publication authority must compare identity, form, source evidence, judgment subject, duplicate counts, and inventory membership before returning `validated-publication`.

No `core/src/semantic/foundation` dependency was added. No generic judgment wrapper was added. The full package build was not run.

## Verification

- Phase 1728 interface audit: 17/17 PASS.
- Phase-specific interface audits, Phase 1721–1728: 126/126 PASS across eight phase audit scripts.
- Historical cumulative regression checks: Phase 1725 75/75, Phase 1726 90/90, Phase 1727 109/109 PASS.
- Targeted TypeScript check exits with code 2 due 88 diagnostics in unrelated existing modules; no diagnostics reference either changed interface file.
