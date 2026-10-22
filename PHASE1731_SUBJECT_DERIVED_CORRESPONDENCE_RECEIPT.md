# Phase 1731 — Subject-Derived Correspondence Receipt

## Trace

The coverage pipeline already models source subjects as the canonical owner of invocation form, KnowledgeId, and source evidence. Phase 1730 documented that correspondence identity should be derived from the canonical inventory subject, but the receipt still accepted a separately supplied `identity` field. That made the receipt itself capable of carrying a contradictory identity beside its own inventory and publication entries.

## Interface-first change

`InvocationSemanticCoveragePublicationCorrespondence` no longer accepts a separately supplied identity. Its identity is derived from `inventoryEntry.subject`; the publication authority must correlate `publicationEntry.subject` and any published judgment against that canonical subject. The receipt therefore contains only the two entries that are actually being audited.

Updated contract versions:

- `InvocationSemanticCoverageContract`: v23 → v24
- `InvocationSemanticPipelineContract`: v39 → v40
- `LaravelControllerInvocationSemanticBoundaryContract`: v18 → v19

The scanner boundary now says it forwards correspondence receipts and upstream validation outcomes without synthesizing an identity. No scanner wiring or production runtime implementation was changed.

## Invariants still required from authority

The type contract does not itself prove equality of the inventory and publication subjects at runtime. The future publication authority must validate subject form, KnowledgeId, source span/evidence, publication disposition, and the published judgment's invocation identity; enforce one-to-one cardinality; and return a typed rejection ledger for mismatch, omission, duplication, or out-of-inventory entries. Do not claim total semantic coverage until that implementation and its fixtures exist.

## Scope and verification

- Interface contract evolution only.
- No dependency on `core/src/semantic/foundation`.
- No static invocation authority or scanner wiring claimed as implemented.
- Audit command: `npm run audit:phase1731-subject-derived-correspondence-receipt`.
