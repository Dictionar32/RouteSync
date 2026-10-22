# Phase 1733 — Publication Authority Interface Contract

## Scope

This phase strengthens upstream interfaces only. It does not implement publication authority and does not change Laravel production wiring.

## Trace

- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`: defines inventory subjects, typed publication violations, validated/rejected publication results, and the publication interface.
- `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`: states that scanner consumes only authority-validated receipts and preserves typed rejection ledgers without repair.
- `packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts`: still delegates ordinary invocation analysis through `invocationSemanticPipeline.analyzeKnowledge(...)`.

## Interface changes

- Added `InvocationSemanticCoveragePublicationAuthorityBoundaryContract` and its frozen value.
- Required the publication interface to expose that boundary contract.
- The boundary explicitly owns identity derivation from canonical inventory subjects, uniqueness/cardinality, judgment/source binding, typed rejection, receipt ownership, and static coverage truthfulness.
- `InvocationSemanticCoverageContract`: v24 → v25.
- `InvocationSemanticPipelineContract`: v41 → v42.
- `LaravelControllerInvocationSemanticBoundaryContract`: v20 → v21.

## Non-goals and limitations

- No publication authority implementation was added.
- No production wiring changed.
- Static invocation remains explicitly uncovered until its algebra and authority are implemented.
- This phase's audit is contract-shape validation, not end-to-end runtime proof.
