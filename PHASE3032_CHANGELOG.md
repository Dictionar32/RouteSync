# Phase 3032 Changelog

- Extended `PhpFunctionInvocationNameIdentity` to retain each lexical segment's `SourceSpan`.
- Extended malformed-name identity to retain its source span alongside the closed syntax reason.
- Updated typed identity equality to compare segment names and source provenance through `sourceSpanOperations.same`.
- Added a static audit and runtime trace report for the upstream → CLI → manifest path.
- Preserved duplicate invocation evidence rejection, deleted relation-foundation constraints, and the `collections.ts` one-newline invariant.
- No claim of full typecheck, full Vitest, or CLI-to-manifest end-to-end validation.
