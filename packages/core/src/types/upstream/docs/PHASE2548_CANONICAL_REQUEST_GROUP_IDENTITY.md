# Phase2548 — Canonical Request Group Identity

## Root cause

The upstream request-type derivation contract defines group identity as canonical resource identity, and the source-evidence inventory owns the canonicalization operation. The legacy aggregation solver nevertheless keyed request groups using `requestBinding.identity.resource.value.value.toLowerCase()`. That bypassed the canonical identity owner and made the grouping key a second, locally derived representation.

## Change

The solver now obtains its group key from `requestTypeDerivationSourceEvidenceInventory.canonicalResourceIdentity(requestBinding.identity.resource).semanticKey`. This reuses the existing upstream operation; it adds no duplicate interface, no new identity policy, and no dependency on semantic foundation or relations.

## Scope and limits

This closes the specific group-key identity inconsistency only. It does not migrate the relation-backed solver, produce a `RequestTypeDerivationJudgment`, implement the full 32-law verifier, or complete the CLI authority cutover. Those remain explicit blockers and must not be represented as completed by this phase.
