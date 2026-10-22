# RouteSync Phase 2578 — Source Occurrence Input Membership

## Root cause

The source-occurrence verifier conflated evidence-location self-consistency with source membership in the canonical derivation input. If a supplied evidence item did not exist in the input, the old location-failure path could fall back to a location reconstructed from that same untrusted evidence. That made the counterexample echo the supplied source rather than state that the occurrence was absent from the input.

## Implementation

- Added `source_occurrence_belongs_to_input` to the canonical upstream derivation law algebra and required law coverage.
- Added the typed `source_occurrence_not_found_in_input` verification failure with the supplied source evidence and candidate locations for the same canonical semantic identity in the input.
- Added candidate-location projection for route, resource, and request input domains using the existing canonical identity operations.
- Separated input membership validation from source-location self-consistency validation.
- Kept the existing source-occurrence verifier as a guard/decorator over the injected complete proof verifier; it does not claim to prove the remaining derivation laws.
- Added `audit:phase2578-source-occurrence-input-membership` and the upstream report at `packages/core/src/types/upstream/docs/PHASE2578_SOURCE_OCCURRENCE_INPUT_MEMBERSHIP.md`.

## Architecture boundary

No fallback solver, duplicate identity interface, `semantic/foundation` dependency, or `semantic/relation` dependency was introduced. The active CLI composition remains fail-closed and requires an injected semantic pipeline.

## Validation

- 26 selected audit scripts from the Phase 2552–2578 series passed.
- Phase 2578 audit: 14/14 assertions passed.
- Existing audit scripts that emit per-phase totals reported 213/213 assertions across those reports; other scripts passed their named checks without a common assertion summary.
- TypeScript syntax transpilation and `package.json` parsing passed.
- ZIP integrity passed.
- Full TypeScript typecheck, package build, Vitest, and CLI end-to-end were not run because this snapshot has no `node_modules` directory.
