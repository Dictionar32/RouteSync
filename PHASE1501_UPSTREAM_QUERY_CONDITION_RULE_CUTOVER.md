# Phase 1501 — Upstream Query Condition Rule Cutover

## Objective

Strengthen the semantic model so the upstream interface is the decision authority and scanner code only wires evidence and projects closed judgments. This phase continues Phase 1500; it does not claim the whole query scanner has become a pure executor.

## Trace findings

- `packages/core/src/types/upstream/queryProducerSemanticInterface.ts` is the contract boundary. `QueryOperationEvidence` is the input and `QueryOperationSemanticDecision` carries rule identity plus resolved/malformed/not-applicable outcome.
- `packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts` owns the semantic decision for query operation families. Phase 1501 adds explicit rule identities for range, membership, and null predicates.
- `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts` now delegates these families through `resolveQueryOperation`. The corresponding `whereBetween`, `whereIn`, and `whereNull` catalog handlers were removed from the scanner catalog.
- `queryMethodOperationJudgment` now asks the unified upstream interface before falling through to remaining unclaimed legacy operation families.

## Model change

The decision algebra now distinguishes:

- `query_join_rule`
- `query_basic_condition_rule`
- `query_range_condition_rule`
- `query_membership_condition_rule`
- `query_null_condition_rule`
- `unclaimed_query_operation_rule`

Known-family malformed evidence stays malformed and is not treated as unclaimed. Unknown method names remain `not_applicable` so only the remaining migration frontier may consider them.

## Semantic behavior

- Range predicates require a field and exactly two array values.
- Membership predicates require a field and a values expression.
- Null predicates require a field.
- The `orWhere*` family is represented as `or_where`; negation is represented explicitly on the condition.
- The scanner no longer contains duplicate handlers for the three migrated families.

## Remaining frontier

The scanner still owns other query method families, including `whereBetweenColumns`, `whereValueBetween`, `whereNullSafeEquals`, relation predicates/aggregates, ordering/grouping, and execution configuration methods. Those must be migrated family-by-family before the scanner can be called a pure executor. The AST's `operations` compatibility projection also remains alongside `operationJudgments`; downstream consumers still need a separate single-source-of-truth migration.

## Validation

- Phase 1501 static audit: expected to verify the new upstream rule families, scanner delegation, and removal of migrated handlers from the scanner catalog.
- Phase 1500 audit: retained as a historical boundary check.
- Full typecheck/test/build: not verified in this workspace because project dependencies are absent and the available global TypeScript 5.8.3 does not support the project's configured ES2025 target.
