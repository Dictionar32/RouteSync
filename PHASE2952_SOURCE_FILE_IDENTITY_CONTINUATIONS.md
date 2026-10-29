# Phase2952 — Source-file identity relation continuation ADT

## Runtime trace

`CLI manifest composition → upstream source-project identity semantics → relateSourceFiles(left, right) → SourceFileIdentityRelationJudgment.continueWith({ onSame, onDifferent }) → route source selection / inventory uniqueness / inventory correspondence`.

## Change

The existing upstream `SourceFileIdentityRelationJudgment` previously returned only the `same_source_file_identity` or `different_source_file_identity` data arm. Both arms now carry the existing domain-shaped continuation operation through `SourceFileIdentityRelationOperations`; `SourceFileIdentityRelationHandlers` names the two possible identity outcomes. The producer attaches the operation at the existing identity authority, and the upstream barrel explicitly exports its contracts.

Runtime consumers in route source selection and controller invocation inventory now consume the relation through `continueWith`, rather than re-dispatching on `.kind`. No new generic collection or relation abstraction was introduced, and `packages/core/src/types/upstream/collections.ts` remains empty.

## Verification boundary

The Phase2952 structural audit checks contract ownership, both executable ADT arms, the migrated runtime consumers, explicit barrel exports, and the empty collections file. It does not substitute for full typecheck, full tests, build, or CLI end-to-end verification.
