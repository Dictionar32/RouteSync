# Phase 1518 — Interface-Owned Query Derivation Lineage

## Goal

Strengthen the existing query semantic interface so every claimed query operation returns an explicit, typed derivation record tying the declared rule identity to its source evidence and closed outcome. This is an interface/model change, not a new wiring layer or runtime executor.

## Changes

- Added `QueryOperationSemanticDerivation`, a family-indexed discriminated union in `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`.
- Claimed `resolved` and `malformed` decisions now carry a derivation record with the rule family, method name, argument count, outcome, and corresponding conclusion kind.
- The upstream authority constructs that record at the point where the evaluator result is closed into the public decision.
- `not_applicable` remains reserved for unclaimed methods and does not fabricate a derivation.
- Exported the contract from `packages/core/src/index.ts` and added tests for resolved/malformed lineage.
- Scanner continues to consume the upstream judgment and does not gain a parallel semantic model.

## Important limitation

The derivation is currently a typed lineage record, not a proof object demonstrating that each declared premise and constraint was independently discharged. Rule evaluators still perform argument validation and AST construction. This phase therefore strengthens interface ownership and traceability but does **not** claim runtime-executor-only architecture is complete.

## Validation

- Phase 1518 source audit: 9 checks.
- Prior phase audits: run alongside this audit to detect regressions in declarative declarations, catalog integrity, rule ownership, and scanner boundaries.
- Full TypeScript build and unit tests require project dependencies; do not claim they pass unless executed in a dependency-complete workspace.
