# Phase 1534 — Interface-first source-bound query execution

## Change boundary

This phase strengthens the existing `QueryProducerSemanticInterface`; it does not add a parallel semantic authority. The scanner now sends `QueryOperationSemanticSourceEvidence` (including the original `SourceSpan`) through `resolveQueryOperationEvidence`, and reads the decision from that single upstream-owned execution envelope.

## Model improvement

- Source evidence, source span, and the resulting closed decision travel together in `QueryOperationSemanticEvidenceBoundExecution`.
- The interface records the current proof limitation as `evaluator_obligations_not_yet_emitted`. It does not falsely claim the rule premise/constraint ledger is already proven.
- Existing rule ownership and decision validation remain upstream-owned. The scanner no longer invokes the detached-evidence entry point for these two call paths.
- The legacy method catalog remains only for explicitly unclaimed migration-frontier families; this phase does not claim that frontier is closed.

## Important remaining semantic migration

`queryProducerSemanticReasoning.ts` still contains the concrete rule evaluators and many argument/operator/property checks. The interface now binds source evidence to the decision, but it does **not** yet require evaluators to emit the full family-indexed obligation ledger. Next migration should make each rule evaluator return a judgment with receipts for each required premise and constraint, validate those receipts against the rule declaration, and only then allow a proof-complete resolved result to reach runtime projection.

## Verification

Run:

- `npm run audit:phase1534-source-bound-query-semantic-interface`
- `npm run audit:phase1500-interface-first-query-operation-authority`
- `npm run build`

An audit pass proves the source-bound interface wiring checks only; it does not substitute for a successful TypeScript build or prove all semantic obligations.
