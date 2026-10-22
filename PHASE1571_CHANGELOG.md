# Phase 1571 — Pairwise Duplicate Occurrence Contract

## Goal

Strengthen the upstream request-type derivation interface without changing scanner wiring or runtime execution.

## Semantic model change

- Added `all_duplicate_occurrence_locations_are_pairwise_distinct` to the semantic law vocabulary.
- Added the typed verification counterexample `duplicate_occurrence_pairwise_location_reused`.
- The counterexample records the source domain, colliding semantic key, and a non-empty ledger of every repeated pair, including both source evidence references and the reused occurrence key.

## Why

The previous duplicate witness explicitly identified `first`, `second`, and `additional` occurrences, but its law/counterexample shape did not explicitly require every occurrence beyond the primary pair to be pairwise distinct from every other occurrence. The new contract makes the all-pairs invariant explicit for semantic authority to enforce.

## Trace boundary

No changes were made to:
- `packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts`
- `packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts`
- `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts`

Authority implementation, scanner migration, full build, and Vitest are not claimed as completed in this phase.

## Validation

- Phase 1571 static interface audit: 10/10 passed.
- Phase 1570 duplicate-pair regression audit: 9/9 passed.
- Full build/typecheck not run because workspace dependencies (`node_modules`) are absent.
