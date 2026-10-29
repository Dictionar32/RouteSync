# Phase 2992 changelog

- Moved inline-validation evidence classification to the controller-body semantic source authority.
- Added the explicit `ControllerInlineSchemaEvidence` ADT to `ControllerBodySemanticJudgment`.
- Passed the exact source-owned evidence into the schema judgment authority.
- Removed collection-cardinality reclassification from `controllerActionSchemaSemanticJudgmentAuthority.ts`.
- Kept schema derivation as a domain operation (`deriveFormRequestSchema`) rather than generic callback continuation.
- Bumped body judgment contract version from 5 to 6 and schema judgment authority contract version from 3 to 4.
- Added reproducible structural audit: `scripts/audits/audit-phase2992-source-owned-inline-schema-evidence.cjs` (13/13 passed).
- Syntax-transpiled all 8 changed TypeScript files without syntax diagnostics.
- Full typecheck and test suite remain unverified: local dependencies are absent and the global TypeScript compiler does not support the repository's ES2025 configuration.
- End-to-end provenance from this schema judgment through serialized route manifest and IR remains an explicit open trace, not claimed closed.
