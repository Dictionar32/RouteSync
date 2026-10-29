# Phase 3049 Changelog

- Added source-backed `SemanticAssignmentReferenceIdentityBinding` and typed `identityProjection` operation to the canonical assignment-reference definitions.
- `by_value` and `by_reference` definitions now own their respective identity-binding behavior.
- Removed the `isByReferenceAssignment` reference-code check from `semanticObjectIdentityAuthority`; analysis consumes the reference definition's projected bindings.
- Preserved source provenance on `assignment_reference` proof facts.
- Added focused Phase 3049 tests and static audit.
- Preserved deleted relation-foundation constraints and `collections.ts` one-byte newline invariant.
