# Phase 1536 — Source-Bound Execution Validation

## Objective

Strengthen the existing query semantic interface before further runtime migration. The scanner must consume a source-bound upstream decision only when the authority envelope is internally consistent. This phase does not fabricate proof receipts or claim that evaluator obligations are complete.

## Change

- Added `QueryOperationSemanticEvidenceBoundExecutionValidation` and `validateQueryOperationSemanticEvidenceBoundExecution` to `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`.
- The validator checks the ownership/discriminant pairing, verifies the proof-status appropriate to that ownership state, and reuses `validateQueryOperationSemanticDecision` for claimed decisions.
- Wired both source-bound query operation paths in `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts` through the validator.
- Invalid envelopes fail closed. They do not proceed into scanner-side legacy interpretation.
- Added `audit:phase1536-source-bound-execution-validation`.

## Architectural boundary

`Source Expression + SourceSpan -> Upstream Semantic Authority -> Validated Source-Bound Execution -> Scanner Projection`

Only an explicitly `unclaimed` operation can continue to the remaining legacy compatibility catalog. A claimed but malformed or contract-invalid result does not get reclassified by that catalog.

## Honest limitation

`proofStatus: evaluator_obligations_not_yet_emitted` remains unchanged. The semantic evaluator still does not emit the full family-indexed premise/constraint receipt ledger. This phase validates the authority envelope and decision consistency; it does not claim proof-complete semantic derivation.

## Verification

- Phase 1536 source-bound execution validation audit: 7/7 passed.
- Phase 1535 ownership-correlated runtime contract audit: 7/7 passed.
- Phase 1534 source-bound query interface audit: 11/11 passed.
- Phase 1500 interface-first query operation audit: passed.
- Phase 1501/1502/1503 legacy migration audits: still fail on missing rule-family cutovers/delegation; these remain migration work, not silently treated as fixed.
- `npm run build`: not run successfully because `tsdown` is not installed in this workspace (`sh: 1: tsdown: not found`). TypeScript build status is therefore unverified.

## Research basis

MLIR's official interface documentation motivates generic consumers that depend on semantic interfaces instead of special-casing each operation: https://mlir.llvm.org/docs/Interfaces/ . TypeScript's compiler architecture overview documents separation between parsing, binding, semantic checking, and emission: https://github.com/microsoft/TypeScript/wiki/Architectural-Overview/f57ad9eff2b43942a46fd6c57ddb70c0b372b035 . These are architectural references, not evidence that RouteSync's implementation is build-verified.
