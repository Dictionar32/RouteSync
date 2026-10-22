# Phase 1797 — PHP Invocation Batch Authority Interface-First

## Trace finding

The repository already had a batch-closure interface, but callers had to supply preassembled invocation judgment entries. That made the batch contract a low-level validator rather than the explicit authority boundary that correlates the complete source inventory with the upstream name-resolution judgments and derives the invocation judgments.

## Model elevation

The existing `PhpFunctionInvocationSemanticJudgmentBatchClosureAuthorityInterface` was evolved instead of introducing a parallel batch subsystem:

- Added `PhpFunctionInvocationSemanticJudgmentBatchDerivationInput` containing a complete source inventory and the existing name-resolution judgments.
- Added `derive` to the existing batch authority interface.
- The authority correlates judgments to inventory entries by the exact `resolutionInput` object identity, delegates invocation judgment creation to the existing `phpFunctionInvocationSemanticAuthority`, and then invokes the existing closure operation.
- Missing judgments remain closure violations; multiple judgments for one source occurrence create duplicate-entry violations; resolution judgments outside the inventory are explicitly rejected.
- The batch contract advanced from version 4 to version 5 and declares the new totality/ownership obligations.
- The existing authority implementation and export boundary are reused. No new integrated-response layer was created.

## Current limitation

The Laravel method-body scanner still does not produce the whole-file namespace/import/declaration inventory needed to call this batch authority end-to-end. The pending integration state is therefore intentionally retained. This phase creates and implements the batch authority contract; it does not claim the scanner is already wired to a complete PHP batch.

## Audit

Run `node scripts/audits/audit-phase1797-php-invocation-batch-authority-interface-first.cjs`.

This is a static contract audit, not a TypeScript build or end-to-end integration test. Build/typecheck were not run.
