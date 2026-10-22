# Phase 1505 — Existing Interface Authority: LIKE Predicate Cutover

## Architectural decision

This phase extends the existing `QueryProducerSemanticInterface` rule union and its existing `resolveQueryOperation` entry point. It does not introduce a parallel interface or a second semantic dispatcher.

## Trace and change

- `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`: adds the closed rule identity `query_like_condition_rule` to the existing `QueryOperationSemanticRule` union.
- `packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts`: introduces a closed descriptor catalog that captures junction (`where` / `or_where`) and polarity (positive / negated). `resolveLikeCondition` validates field and pattern evidence, models optional case sensitivity, and produces the final query operation. The existing `resolveQueryOperation` dispatcher returns a rule-carrying `resolved` or `malformed` judgment.
- `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`: removes the scanner-local `whereLike`, `orWhereLike`, `whereNotLike`, and `orWhereNotLike` operation handler. Those methods now flow through the upstream authority before any legacy fallback is considered.
- `packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts`: adds coverage for negated OR-LIKE resolution and malformed missing pattern evidence.
- `scripts/audits/audit-phase1505-existing-interface-like-authority.cjs`: asserts interface ownership, dispatcher wiring, scanner cutover, and tests.

## Why this is a model improvement

The four source spellings are no longer semantic branches owned by the scanner. They are instances of one typed semantic family described by two closed dimensions: logical junction and polarity. The algebra turns source evidence into a complete `QueryOperationAst`; the scanner only transports that result. Missing evidence for a recognized method is `malformed`, not silently reinterpreted as an unknown method.

## Verification boundary

The static phase audit and TypeScript transpilation syntax checks are intended to run in this workspace. A passing static audit does not replace the repository's full typecheck, build, or Vitest suite; those require the project's pinned dependencies.

## Remaining boundary

The scanner still contains legacy semantic handlers for raw predicates, row-value predicates, JSON predicates, full-text and vector predicates, relation predicates/aggregates, ordering/grouping, and execution configuration. `QueryAst` also retains `operations` as a compatibility projection beside `operationJudgments`. The next architectural step is to migrate each family through the same existing upstream contract and then remove compatibility projections only after downstream consumers have moved to judgments.
