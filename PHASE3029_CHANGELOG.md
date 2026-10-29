# Phase 3029 changelog

- Migrated `phpFunctionNameResolutionAuthority` source-span equality to `sourceSpanOperations.same`.
- Migrated non-empty span validity to `sourceSpanOperations.validateNonEmpty`.
- Migrated source-region containment to `sourceSpanOperations.contains`.
- Added a scoped static audit and runtime trace documenting the CLI → manifest composition → PHP function-name resolution path.
- Preserved the deleted relation-foundation constraint and the one-newline `collections.ts` sentinel.
- Validation: Phase 3029 audit 8/8; Phase 3028 audit 6/6; Phase 3027 audit 8/8; Phase 3026 audit 10/10; Phase 3025 audit 9/9. Typecheck, full Vitest, and end-to-end manifest execution remain unverified because project dependencies are not installed in the runtime.
