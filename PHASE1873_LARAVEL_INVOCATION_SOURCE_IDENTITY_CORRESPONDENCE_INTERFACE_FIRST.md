# Phase 1873 — Laravel Invocation Source Identity Correspondence (Interface First)

## Trace

`SourceFileIdentityRelationJudgment` is already the upstream typed owner of the source identity relation. The source-binding outcome duplicated the same endpoint identities in parallel fields (`sourceFile`, `controllerSourceFile`, and `pipelineSourceFile`) alongside `identityJudgment`. Those aliases could drift from the judgment that supposedly justified them.

## Change

- Made `identityJudgment` the sole typed owner of source identity endpoints in both source-binding outcomes.
- Removed redundant source-file aliases from the closed and rejected outcomes.
- Kept the exact original `pipelineResult` attached to both outcomes.
- Advanced the source-binding contract to version 4 and made endpoint ownership explicit.
- Kept the existing source identity authority as the only owner of same/different identity classification.

## Scope boundary

No scanner runtime, scanner wiring, subscanner, `semantic/relations`, or `semantic/foundation` implementation was changed. This phase deliberately establishes the upstream type contract before any downstream migration. TypeScript compilation/full build was not run; the audit is a structural contract audit only.

## Validation

Run `node scripts/audits/audit-phase1873-laravel-invocation-source-identity-correspondence-interface-first.cjs`.
