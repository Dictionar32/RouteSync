# Phase 1504 — Existing Interface Authority: Exists Predicate Cutover

## Architectural decision

This phase does **not** introduce a second semantic interface. It extends the existing `QueryProducerSemanticInterface` contract through its existing `QueryOperationSemanticRule` union and its existing `resolveQueryOperation` entry point, with implementation in `queryProducerSemanticAlgebra`.

## Trace

- `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`: adds `query_exists_condition_rule` to the existing closed rule identity.
- `packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts`: adds a typed descriptor catalog and `resolveExistsCondition`; the existing `resolveQueryOperation` dispatcher owns the result and emits resolved/malformed judgments with rule identity.
- `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`: removes the scanner-local `whereExists` / `orWhereExists` / negated-exists semantic handler. The existing scanner dispatch now delegates these names through the same upstream entry point.
- `packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts`: covers resolved negated OR-exists and malformed missing evidence.

## Semantic contract

The descriptor represents junction and polarity as closed ADTs, not as independently inferred method-name checks in the scanner. Known exists methods with missing query evidence are `malformed`; unknown methods remain `not_applicable` through the existing `unclaimed_query_operation_rule` result.

## Remaining boundary

The scanner still contains other legacy families (relation predicates/aggregates, row values, raw, JSON, like/full-text/vector, ordering/grouping, and execution configuration). `QueryAst` also retains `operations` beside `operationJudgments` for compatibility. Therefore this phase is a bounded authority cutover, not a claim that the whole scanner is already a pure executor. Full build and test suite must be run in an environment with the repository's pinned dependencies.
