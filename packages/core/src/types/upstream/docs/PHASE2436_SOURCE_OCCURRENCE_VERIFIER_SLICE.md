> **Superseded by Phase2437:** the standalone local ADT described in this historical phase was replaced by an adapter implementing the existing `RequestTypeDerivationProofVerificationInterface`; the pipeline assembler now installs that guard around its injected verifier. See `PHASE2437_SOURCE_OCCURRENCE_INTERFACE_VERIFIER.md`.

# Phase2436 — Source-occurrence verifier slice

## Implemented

Added `verifyRequestTypeSourceOccurrences` under the RequestType derivation semantic owner. It checks three existing canonical laws:

- `source_occurrence_key_matches_source_coordinates`
- `source_occurrence_location_matches_evidence`
- `all_duplicate_occurrence_locations_are_pairwise_distinct`

It also checks that supplied evidence occurrences map back to the provided input's source coordinates and that route/resource/request inventory counts match. The result is a closed success/failure ADT with concrete violation records. The operation imports neither `semantic/foundation` nor `semantic/relations` and does not introduce a parallel law vocabulary.

## Scope boundary

This is a verifier component for three source-occurrence laws, **not** the complete `RequestTypeDerivationProofVerificationInterface` implementation. It does not claim the other 29 laws are verified and it is not yet wired into a production semantic pipeline. The active CLI path still uses the legacy RequestType projection until a complete producer, all-law verifier, decision, and authority composition are implemented and injected. Do not mark Phase2436 as full interface-first CLI closure.

## Validation

Run:

```sh
node scripts/audits/audit-phase2436-source-occurrence-verification.cjs
```

This is a structural audit. Typecheck, build, unit tests, and end-to-end CLI tests were not run in this workspace because dependencies are not installed here.
