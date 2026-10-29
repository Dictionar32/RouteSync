# Phase 3047 Changelog

- Replaced assignment effect factory's separate identity/target/effect/source arguments with one `SemanticAssignment` domain input.
- Expression and statement producers now create one canonical assignment object and reuse it for both the semantic fact and mod/ref projection.
- Updated Phase 3045/3046 focused regression tests to use the concrete domain operation.
- Added Phase 3047 runtime trace audit and npm script.
- Preserved source provenance, target identity, existing blocker semantics, deleted-relation-foundation constraint, and the one-newline `collections.ts` invariant.
