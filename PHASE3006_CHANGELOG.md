# Phase 3006 Changelog — Operational PHP Source Pipeline ADT

- Promoted complete and blocked PHP source-invocation pipeline results from payload-only variants to operational ADTs with `continueWith({ onComplete, onBlocked })`.
- Added operational continuation to the composition-evidence ADT: `not connected`, `connected`, and `source-binding rejected` each own their next domain operation.
- Changed the pipeline integration authority to consume the pipeline result and composition evidence through `continueWith`, removing its `switch` dispatch over those ADTs.
- Changed source-file identity binding to consume `SourceFileIdentityRelationJudgment.continueWith` rather than redispatching on `identityJudgment.kind`.
- Preserved exact complete/blocked pipeline payloads, source-binding judgment, and source identity relation. The integration layer still distinguishes `not connected`, source-binding rejection, complete, and blocked outcomes.
- Bumped `PhpSourceInvocationSemanticPipelineContract` type/runtime version from 2 to 3 to document the new terminal and composition-evidence operations.
- Corrected the pipeline authority interface's `kind` contract and its runtime value to `php_source_invocation_semantic_pipeline_authority`.
- Updated the affected scanner test fixture to construct operational not-connected evidence.
- Added a repeatable structural/syntax audit and runtime trace report.
- Preserved `packages/core/src/types/upstream/collections.ts` as empty and did not restore removed relation foundation modules.

## Verification boundary

- Structural audit and TypeScript syntax transpilation are reported separately from type checking.
- Full type checking remains blocked by pre-existing workspace problems, including unresolved imports to the deliberately removed relation foundation modules, the intentionally empty `collections.ts`, missing `vitest` installation/types, and unrelated existing type errors.
- No Vitest suite or CLI/Laravel end-to-end test is claimed as run.
