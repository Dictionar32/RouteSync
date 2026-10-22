# Phase 1528 — Provenance-Correlated Authority Interface

## Scope
Interface-first type-model evolution only. No runtime function bodies or scanner implementation were changed.

## Model changes
- Added `QueryOperationSemanticSourceEvidence`, which binds the existing operation evidence payload to source provenance as one typed value.
- Added family-indexed `QueryOperationSemanticProvenanceJudgmentFor` and its closed union. Resolved judgments require a satisfied obligation ledger; malformed judgments carry evaluated obligations; undetermined judgments preserve unproven obligations.
- Added `QueryOperationSemanticOwnedExecutionPlanFor`, binding a rule family, its declaration contract, executor request, and provenance-carrying judgment.
- Added `QueryOperationSemanticRuntimeClaim`, where a claimed result carries the correlated execution plan and an unclaimed result carries no plan.
- Refined `QueryOperationSemanticRuntimeAuthority` to expose correlated claims rather than a detached claim union plus executor table.
- Exported the new model types from the public core index.

## Migration boundary
`queryProducerSemanticReasoning.ts` and `queryEvidenceProducer.ts` remain unchanged. This phase defines the target interface contract only; it does not claim the existing runtime is migrated to it.

## Verification
Run `npm run audit:phase1528-provenance-correlated-authority-interface`.
A passing audit verifies the source-level interface contract, not full TypeScript compilation or runtime migration.
