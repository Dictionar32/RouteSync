# Phase 1502 — Upstream Query Rule Authority Expansion

## Objective

Continue the interface-first cutover by moving the next three query-condition families out of the scanner's semantic catalog. The authority must return closed rule-carrying decisions; scanner code must not recreate their operations.

## Trace

- `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`: extended the closed rule identity with `query_column_range_condition_rule`, `query_value_range_condition_rule`, and `query_null_safe_equality_rule`.
- `packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts`: owns their method vocabularies, argument validation, operation construction, and malformed judgments through `resolveQueryOperation`.
- `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`: removed scanner catalog handlers for `whereBetweenColumns`, `whereValueBetween`, and `whereNullSafeEquals` families. The existing unified authority is called before the remaining legacy catalog fallback.
- `packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts`: added resolved and malformed evidence cases for the migrated families.

## Semantic model improvement

The interface is not merely a collection of primitive-shaped callbacks. It is a rule authority that accepts typed evidence and returns a closed decision containing either a resolved operation plus rule identity, a malformed judgment plus rule identity, or an explicit unclaimed result. Rule descriptors use closed junction/polarity ADTs instead of boolean flags, and named descriptor fields replace positional tuple semantics. Known rule families reject invalid evidence instead of falling through to scanner interpretation.

## Remaining boundary

This phase does not claim that the entire scanner is a pure executor. `queryNamedMethodOperationCatalog` still contains unmigrated relation, aggregate, date, grouping, ordering, raw, and execution-configuration families. The next cutover should move those rule families upstream, then remove the scanner catalog entirely. Separately, AST `operations` compatibility projection still coexists with `operationJudgments`; downstream single-source-of-truth migration remains required.

## Validation

The phase audit checks contract/algebra rule identity, scanner handler removal, and delegation order. Syntax transpilation is performed independently. Full typecheck/build/test results are reported separately and must not be inferred from a static audit.
