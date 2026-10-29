# Phase 3040 Changelog

- Added source-backed `SemanticModRefBlocker` ADT variants for assignment, invocation, access, and unset evidence.
- Changed `modRefEvidence` to consume the canonical semantic knowledge graph.
- Applied the operation in `semanticObjectIdentityAuthority.analyze`.
- Expanded regression coverage to verify blocker identity and source provenance.
- Added `audit:phase3040-modref-source-blocker-coverage` and its JSON report.
- Preserved the explicit unresolved state; no inferred mod/ref relation is fabricated.
