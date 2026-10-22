# Phase 1727 — Coverage Publication Validation Outcome

## Trace finding

Phase 1726 defined inventory-bound coverage publication and declared one-to-one correspondence as a contract invariant. However, the publication authority interface returned `InvocationSemanticCoveragePublication` directly. That return type did not distinguish a publication that had passed correspondence validation from one that merely had the expected shape. It also did not expose a typed failure path for duplicate, missing, orphaned, or source-mismatched entries.

## Interface-first correction

The publication boundary now returns `InvocationSemanticCoveragePublicationResult`, a closed domain union:

- `validated-publication`: publication plus a typed validation witness tied to the coverage contract;
- `rejected-publication`: a non-empty ledger of typed correspondence violations.

Violation variants cover duplicate inventory identity, missing publication entry, duplicate publication entry, publication entry outside the inventory, judgment subject mismatch, and source evidence mismatch. The authority owns the decision; scanner wiring must forward the result without repairing or reclassifying it.

Contract versions: coverage v20, invocation pipeline v36, Laravel controller invocation boundary v15. The new result and violation types are exported from `packages/core/src/index.ts`.

## Scope and non-claims

This phase strengthens the contract only. It does not implement the publication authority, inventory implementation, static invocation algebra/authority, or Laravel production wiring. A TypeScript result variant does not itself prove runtime correspondence; the authority implementation must validate all declared invariants before producing `validated-publication`. No `core/src/semantic/foundation` dependency was introduced.

## Verification

See `PHASE1727_AUDIT.json` and `PHASE1727_REGRESSION_AUDIT.json`. Full package build was not run.
