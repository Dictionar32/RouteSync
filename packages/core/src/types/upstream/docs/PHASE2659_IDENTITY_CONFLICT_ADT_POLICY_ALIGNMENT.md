# Phase 2659 — Identity conflict ADT and CLI-to-upstream path

## Root cause

The upstream policy declares duplicate canonical resource identity and group-identity collision as semantic `conflict` outcomes. The prior producer instead converted every duplicate identity witness into `invalid_input`, so its judgment discriminant contradicted the canonical policy. The previous conflict ADT also did not retain all colliding route/request occurrences, which prevented a source-complete collision ledger.

## Contract evolution

`RequestTypeDerivationConflict` now represents duplicate route, request, and resource identities as candidate occurrence lists. The lists preserve all colliding declarations rather than choosing a first occurrence or dropping the extra sources. The canonical source inventory remains the authority for occurrence identity and collision witness generation.

## Runtime flow

```text
CLI scan/sync
  -> standaloneCompositionLoader
  -> manifest composition authority
  -> AST input / canonical preparation
  -> source inventory + identity collision inventory
  -> request/resource resolution ledgers
  -> requestTypeDerivationSemanticReasoning
  -> conflict judgment + source receipts + closure ledger
  -> requestTypeDerivationProofVerifier
  -> verification_incomplete (collision ledger checked; 34 laws still missing)
  -> coverage marks verification_incomplete
  -> decision/authority/integrity remain fail-closed typed gaps
  -> manifest projection is not allowed to treat this as a verified derivation
```

## Verification boundary

The verifier recomputes collision witnesses and source inventory from the raw input, compares the conflict ledger and receipt dispositions, and checks that closure counts match the input inventory. This is a partial source-correlation check only. It returns `verification_incomplete` with all 34 laws listed as missing. The coverage operation propagates that state instead of treating a non-`valid` result as complete.

## Still open

- Full independent proof verification for all 34 laws.
- `derived` judgments with action/response contribution receipts and group-fold receipts.
- A complete typed conflict witness for resource identity mismatch (as distinct from duplicate canonical identity).
- Complete decision algebra, authority adjudication, and integrity validation.
- Full TypeScript build and CLI scan/sync end-to-end tests with repository dependencies installed.
