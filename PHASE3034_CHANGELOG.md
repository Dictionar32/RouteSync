# Phase 3034 changelog

- Added interface-backed `semanticKnowledgeIdOperations.same` and a closed `KnowledgeIdEquality` judgment.
- Migrated `invocationSemanticJudgmentAuthority.ts` away from `knowledgeIdKey` for identity validation.
- Replaced composite obligation key serialization with typed `sameObligationIdentity` comparison while preserving ordered ambiguous candidates.
- Added focused KnowledgeId domain-operation tests and Phase 3034 static audit/report.
- Preserved the deleted relation-foundation constraint and the one-newline `collections.ts` sentinel.
- Full typecheck, Vitest, and CLI → manifest E2E are not claimed as verified.
