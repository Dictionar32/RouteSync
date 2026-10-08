# Phase 535 — Scanner/Resolver Relational Cutover

Targets:
- `columnInferrer.ts`
- `actionValidationExtractor.ts`

Architecture:

`scanner evidence -> semantic relation catalog -> candidate/witness -> recursive relation closure -> canonical authority`

Changes:
- Migration schema discovery is now a recursive relation over migration/operation evidence.
- Create-table and alter-table candidates are represented as `RelationOption` witnesses.
- Schema absence is resolved through relation option folding rather than host-language absence sentinels.
- Inline validation extraction uses relation projection/selection and relation-gated candidate matching.
- Validation-rule normalization is relation projection plus recursive selection.
- FormRequest field authority is a relation-gated semantic witness.
- Inline schema composition is relation-gated semantic resolution.
- No target uses the forbidden parser/resolver control vocabulary.

Validation:
- Phase 535 target audit: all forbidden counts zero.
- Target `transpileModule` diagnostics: zero.
- Existing Phase 534 solver audit is rerun before checkpointing.
