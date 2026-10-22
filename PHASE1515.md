# Phase 1515 — Interface Rule-Obligation Closure

## Objective

Raise the existing `QueryProducerSemanticInterface` model beyond catalog identity and non-empty metadata. The interface-owned rule model now states family-specific minimum semantic obligations, and the upstream validator rejects declarations that omit them.

## Changes

- `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`
  - Added `queryOperationSemanticRuleRequirements`, a total typed mapping for every claimed query-operation rule family.
  - Strengthened `validateQueryOperationSemanticRuleCatalog` to verify family-specific premises and constraints, the evidence field contract, and the closed `resolved | malformed` outcome contract.
  - Validation reports which premise or constraint is missing, rather than treating any non-empty list as a complete semantic declaration.
- `packages/core/src/types/upstream/queryProducerSemanticReasoning.ts`
  - The `query_exists_condition_rule` declaration now explicitly requires nested-query evidence validation.
  - Existing method dispatch continues to derive from the same interface-owned declarations.
- `packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts`
  - Rule fixtures use the canonical obligation requirements.
  - Added a regression case proving that a declaration with only generic `method + arguments + arity` metadata is rejected for a basic condition rule.
- `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`
  - No new scanner-side rule model or interface was added. Claimed families still go through the upstream authority; the old catalog remains only as the explicit migration frontier for unclaimed families.

## Architecture status

The interface is stronger: each rule family now has a minimum obligation contract that is checked for completeness. This is an interface/model improvement, not a claim that all runtime evaluation has become executor-only.

The remaining gap is substantive: family evaluator functions still perform argument validation and AST construction. To make runtime executor-only, future work must turn these obligations into derivation inputs/results and prove per-family that evaluators only execute a closed derivation. Moving callbacks or renaming them would not satisfy that goal.

## Verification

- Source audit: run `npm run audit:phase1515-interface-rule-obligation-closure`.
- TypeScript build and unit tests: not claimed as passed unless run with the repository's pinned dependencies.
