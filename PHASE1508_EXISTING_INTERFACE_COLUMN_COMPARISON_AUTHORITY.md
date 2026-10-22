# Phase 1508 — Existing Interface Column Comparison Authority

## Architectural intent

This phase extends the existing `QueryProducerSemanticInterface`; it does not introduce a parallel interface. Column comparison method recognition, evidence validation, operator resolution, and AST operation construction now belong to `queryProducerSemanticAlgebra.ts`. The scanner only submits method evidence to the existing dispatcher and no longer owns `whereColumn` / `orWhereColumn` handlers or their pair-list classifier.

## Changes

- Added `query_column_comparison_condition_rule` to the existing rule union.
- Added upstream `columnComparisonPredicateCatalog`, `resolveColumnReference`, `resolveColumnComparisonPairs`, and `resolveColumnComparisonCondition`.
- Connected the resolver to the existing `resolveQueryOperation` dispatcher.
- Removed the scanner-local `whereColumn` / `orWhereColumn` handler and the now-unused pair-list classifier.
- Added tests for resolved column comparisons and malformed operator/pair evidence.

## Verification boundary

Run `npm run audit:phase1508-existing-interface-column-comparison-authority` for the static authority audit. Syntax transpilation and ZIP integrity are checked separately. A full project build, full typecheck, and Vitest run are not claimed unless run successfully with the project's dependencies installed.

## Remaining migration boundary

Scanner still owns other legacy families, including JSON, raw, vector, relation predicates/aggregates, ordering/grouping, selection, and execution configuration. This phase is a further authority migration, not a claim that all runtime semantic classification has been removed.
