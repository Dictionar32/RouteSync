# Phase 1662 — Invocation Domain Witnesses

## Problem
`add(ruleId, conclusion, evidence, subject, object)` forced the invocation proof to be authored through a generic rule/conclusion vocabulary. The argument-binding witness was a generic event label rather than a domain object.

## Change
- Replaced the open-ended witness record with a discriminated union of domain relationships: invocation presence, target resolution, target ambiguity, argument binding, unmatched argument, effect projection, unresolved target, and judgment closure.
- Removed generic `ruleId` and `conclusion` fields from the witness contract.
- Replaced the imperative `add(...)` builder with direct construction from semantic relationships in the evidence slice.
- Kept rule trace as audit metadata; ownership is derived from the domain witness kind, not stored redundantly inside each witness.
- Bumped semantic model version to 7 and public contract version to 18.
- Updated the ambiguity test to assert a target-resolution domain witness.

## Verification
The Phase 1662 static audit checks the removal of the generic witness builder and fields. Full TypeScript/build/runtime validation requires the repository's declared TypeScript version and dependencies; the available global TypeScript 5.8.3 cannot compile this repository's ES2025 configuration and required type packages are absent.
