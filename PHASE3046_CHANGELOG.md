# Phase 3046 changelog

- Added `SemanticAssignmentEffectKnowledgeInterface` and `semanticAssignmentEffectKnowledge` as a named, interface-first domain object.
- Changed `SemanticAssignmentOperatorDefinition` to carry its `SemanticAssignmentEffectDefinition` directly.
- Replaced the separate operator-to-effect search catalog with operator-owned effect data.
- Changed `semanticModRefEffectFactory.assignmentWrite` to project the pre-modeled `relationKind` without reclassifying the operator.
- Migrated PHP assignment-expression and assignment-statement producers to pass the canonical operator effect.
- Added Phase 3046 regression coverage for plain write (`mod`), compound read-write (`mod-ref`), target identity, and canonical analysis retention.
- Added `audit:phase3046-assignment-effect-domain-operations` and the phase audit report.
- Preserved the deleted relation-foundation constraint and `collections.ts` one-newline invariant.
