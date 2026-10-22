# Phase 2578 — Source Occurrence Input Membership

## Root cause

The source-occurrence verifier previously combined two different predicates in its location failure path:

1. whether an evidence occurrence actually belongs to the canonical derivation input; and
2. whether the evidence's declared location agrees with its own source identity.

When the occurrence did not exist in the input, `expectedLocationFromInput` could fall back to `expectedLocation(source)`, which is derived from the untrusted evidence itself. That could produce a counterexample whose expected location simply echoed the supplied source rather than describing a missing input occurrence.

## Change

- Added the canonical law `source_occurrence_belongs_to_input` to the upstream law algebra and required-law coverage.
- Added a typed verifier failure `source_occurrence_not_found_in_input` that retains the source evidence and candidate locations for the same canonical semantic identity in the input.
- Added input candidate-location inventory for route, resource, and request source domains.
- Split source membership validation from evidence-location self-consistency. Membership is checked against canonical input identities and source coordinates; location consistency is checked independently.
- Kept the existing source occurrence guard as a decorator over the complete verifier. It does not claim to verify the remaining semantic laws.

## Architecture boundary

The active path remains CLI -> injected upstream semantic pipeline -> evidence inventory -> source-occurrence guard -> complete proof verifier -> decision/authority -> manifest projection. No legacy solver fallback, semantic foundation dependency, or semantic relation dependency is added to this path.

## Validation boundary

The Phase 2578 audit checks canonical law ownership, required coverage, typed failure mapping, source-domain candidate locations, separation of membership from location consistency, and syntax transpilation. Full typecheck, package build, Vitest, and CLI end-to-end are not claimed by this report.
