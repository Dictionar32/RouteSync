# Phase 2653 — Separate producer obligations from verifier claims

## Implemented

`RequestTypeDerivationProof` now carries `requiredLaws: RequestTypeDerivationRequiredLawCoverage` rather than `laws: RequestTypeDerivationVerifiedLawCoverage`.

This closes a contract-level circularity: a reasoning producer must assemble source evidence, receipts, closure, and the canonical law obligations, but must not claim that those laws have already been independently verified. The verifier result remains the sole owner of `verifiedLaws`, and the existing coverage operation continues to require complete verification coverage before authority can accept the result.

The canonical 34-law set and `RequestTypeDerivationContract.laws` remain unchanged. This phase does not implement the full reasoning producer, all-law verifier, decision/authority production composition, or CLI manifest cutover. It is a prerequisite correction, not an end-to-end completion claim.

## Verification

Run:

```sh
node scripts/audits/audit-phase2653-proof-obligation-verification-separation.cjs
```

The audit checks that the law set remains closed, proof obligations are not mislabeled as verified laws, verified-law coverage remains on the verifier result, and production composition still fails closed rather than fabricating missing capabilities.
