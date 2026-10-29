# Phase 3005 Changelog

- Converted `phpSourceInvocationPipelineEvidenceFromSourceBinding` from a directly invoked exported arrow helper into `export const name: Interface = Object.freeze({...})` with a named projection contract.
- Added typed `continueWith` operations to both closed and rejected source-binding ADT outcomes.
- Routed the invocation-judgment authority through `.project(binding)`; the projection now delegates to the ADT continuation instead of switching on the outcome kind itself.
- Preserved the original pipeline result and identity judgment in both outcomes; no source evidence is rebuilt or relabeled.
- Bumped the source-binding contract version from 5 to 6 to reflect the public runtime contract change.
- Added repeatable structural audit and runtime trace report.
- Preserved the intentionally empty `packages/core/src/types/upstream/collections.ts` and did not restore any forbidden relation foundation modules.
- Full project typecheck, Vitest, and CLI/Laravel E2E remain unverified; this phase only claims syntax transpilation and structural audit results.
