# Phase 1509 — Existing Interface JSON Predicate Authority

## Objective

Move JSON predicate semantics out of `queryEvidenceProducer.ts` into the existing upstream `QueryProducerSemanticInterface` and `queryProducerSemanticAlgebra`. No parallel interface was introduced.

## Changes

- Added `query_json_condition_rule` to the existing `QueryOperationSemanticRule` union.
- Added an upstream `jsonPredicateCatalog` covering `whereJsonContains`, `whereJsonDoesntContain`, key predicates, length, overlap predicates, and their `orWhere` variants.
- Added `resolveJsonCondition`, which validates the JSON column, required operands, JSON length comparison operator, and produces a typed `QueryJsonCondition` judgment.
- Routed JSON decisions through the existing `resolveQueryOperation` dispatcher.
- Removed the scanner-local JSON predicate handler from `queryNamedMethodOperationCatalog`.
- Added tests for resolved contains/length predicates and malformed evidence.

## Verification boundary

The Phase 1509 static audit and TypeScript transpilation syntax checks are intended to verify the new interface/algebra/scanner boundary. A successful transpilation is not a substitute for project typecheck, full build, or Vitest execution.

## Remaining migration boundary

The scanner still contains legacy semantic handlers for raw predicates, vector predicates and ordering, relation predicates/aggregates, selection, grouping/ordering, and execution configuration. The `not_applicable` compatibility fallback remains for those unclaimed families. Therefore this phase advances interface-first ownership but does not claim that all runtime paths are executor-only.
