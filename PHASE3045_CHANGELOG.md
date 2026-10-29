# Phase 3045 changelog

- Promoted concrete mod/ref relation vocabulary into `core/src/types/upstream/semanticDataflowKnowledge.ts`.
- Assignment and unset now emit typed write relations to exact target KnowledgeIds.
- Property/array access emits a typed read relation; assignment-target access no longer becomes a false read.
- Unknown invocation effects remain source-backed blockers.
- Added `semanticModRefDomainOperations.phase3045.test.ts` and `audit:phase3045-explicit-modref-effect-outcomes`.
- Preserved the deleted relation-foundation constraint and the single-newline `collections.ts` invariant.
