# Phase 2580 — Source Occurrence Canonical Location

## Root cause

The source-occurrence guard previously checked source membership and evidence-location self-consistency independently. When a source occurrence was not in the canonical input, the location check could still compare against a location reconstructed from the rejected evidence itself. That emitted a second, misleading location counterexample without an authoritative expected location. Route location equality also omitted the explicit `file` and `line` fields and compared only the declaration span.

## Change

- Introduced a closed internal `SourceOccurrenceInputMembership` ADT: `source_occurrence_in_input` carries the canonical input location; `source_occurrence_not_in_input` carries candidate locations.
- Resolve membership using canonical semantic identity and exact source coordinates for route, resource, and request occurrences.
- Emit `source_occurrence_belongs_to_input` when no matching input occurrence exists.
- Run `source_occurrence_location_matches_evidence` only after a matching input occurrence is found, comparing the evidence location with the canonical location from input.
- Compare route location file, line, and declaration span, not only the span.
- Preserve delegation to the injected complete proof verifier after this guard passes. This change does not claim to implement all derivation laws.

## Architecture boundary

The active guard remains upstream-owned and does not import `semantic/foundation`, `semantic/relation`, or the legacy RequestType solver. No new public identity interface or duplicate law registry was introduced.

## Validation

The Phase 2580 structural audit checks the closed membership ADT, canonical identity and coordinate matching, failure separation, full route location comparison, and delegation boundary. TypeScript syntax transpilation is included. Full typecheck, build, Vitest, and CLI end-to-end validation must be run separately.
