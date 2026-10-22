# Phase 1507 — Existing Interface Row-Value Authority

## Architecture decision

This phase extends the existing `QueryProducerSemanticInterface` and `QueryOperationSemanticRule`. It does not create a parallel interface. Row-value predicates are now resolved by the upstream semantic algebra and carry the rule identity `query_row_value_condition_rule`.

## Changes

- Added the closed row-value rule identity to `queryProducerSemanticInterface.ts`.
- Added a typed descriptor catalog for `whereRowValues` and `orWhereRowValues` in `queryProducerSemanticAlgebra.ts`.
- Added upstream validation for positional column arrays, property-name evidence, required values, and supported comparison operators.
- Added resolved and malformed judgments through the existing `resolveQueryOperation` dispatcher.
- Removed the scanner-local row-value handler from `queryEvidenceProducer.ts`; scanner now consumes the existing dispatcher result.
- Added tests for resolved `orWhereRowValues`, unsupported operators, and empty column lists.

## Verification

The phase audit and TypeScript transpilation syntax checks are intended to verify this change. A full repository build, typecheck, and Vitest run are not claimed unless executed separately in an environment with the project dependencies installed.

## Remaining migration boundary

The scanner catalog still contains other semantic families, including JSON, raw, vector, column comparisons, relation predicates and aggregates, ordering/grouping, selection, and execution configuration. This phase does not claim the entire scanner is executor-only. The next architectural task is to continue moving those families into the same upstream authority and remove the legacy catalog only after all consumers are migrated.
