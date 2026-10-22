# Phase 2577 — Source Inventory Law Ownership

## Root cause

The Phase 2576 source-occurrence guard mapped an inventory-key mismatch to `every_source_has_a_disposition`. These are different obligations: the guard compares the evidence inventory's domain-separated semantic-key multiset with the canonical input, while disposition completeness belongs to the semantic judgment's source ledger and closure. Reporting one as the other produced a false law attribution in a typed counterexample.

## Implementation

- Added the canonical upstream law `source_evidence_inventory_matches_input` to `REQUEST_TYPE_DERIVATION_LAW_IDS`.
- Added the law to the canonical `requestTypeDerivationContract.laws` coverage object and typed verification-failure ADT.
- Changed the source-occurrence guard to declare and emit this law for inventory mismatch.
- Removed `every_source_has_a_disposition` from the source-occurrence guard's law inventory; the complete verifier remains responsible for disposition/closure.
- Updated exact-count audits from 32 to 33 because the canonical law algebra was explicitly evolved.
- Added `audit:phase2577-source-inventory-law-ownership`.

## Architecture

`input source evidence → canonical inventory → inventory equality verification → semantic reasoning/verifier → decision/authority → manifest projection`

This is a contract-ownership correction, not a complete RequestType semantic producer. The source-occurrence guard remains a partial verifier decorator and delegates other proof obligations to the injected complete verifier. No legacy solver fallback, `semantic/foundation`, or `semantic/relation` dependency was introduced on this path.

## Validation limits

The phase audit checks canonical law membership, required contract coverage, exact failure-law attribution, separation from disposition completeness, syntax transpilation, and forbidden dependency imports. Full typecheck, package build, Vitest, and CLI end-to-end are not claimed unless separately executed.
