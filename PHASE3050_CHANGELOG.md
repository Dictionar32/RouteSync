# Phase 3050 Changelog

- Added `SemanticAssignmentReferenceFactOperationsInterface` and `semanticAssignmentReferenceFactOperations.identityBindings` in the upstream semantic fact domain.
- Changed `semanticObjectIdentityAuthority` to consume the domain projection instead of owning assignment-fact classification.
- Extended the focused Phase 3049 test to validate projected bindings and provenance.
- Added `audit:phase3050-assignment-reference-fact-domain-continuation` and its JSON report.
- Preserved deleted relation-foundation constraints and the one-byte newline invariant in `collections.ts`.
