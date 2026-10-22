# Phase 1529 — Semantic Outcome Algebra Closure

## Objective
Strengthen the upstream semantic contract before runtime executor migration. This phase changes model declarations and regression/audit expectations only; it does not rewrite scanner or executor function bodies.

## Trace
- `packages/core/src/types/upstream/queryProducerSemanticInterface.ts`: `QueryOperationSemanticProvenanceJudgmentFor` already admits `resolved`, `malformed`, and `undetermined`; the family-indexed rule declaration's outcome tuple and catalog validator previously admitted only `resolved` and `malformed`.
- `packages/core/src/types/upstream/queryProducerSemanticReasoning.ts`: each rule declaration publishes the same outcome tuple as its interface contract. Updated that declaration data to include `undetermined`.
- `packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`: remains a consumer of the existing upstream resolver. Its explicit legacy compatibility frontier is retained; no scanner behavior was changed.
- `packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts` and `scripts/audits/audit-phase1519-interface-owned-execution-contract.cjs`: updated contract fixture and audit expectation to the now-closed three-state outcome algebra.

## Model change
Rule declarations now state the complete proof-state vocabulary: `resolved | malformed | undetermined`. The catalog validator requires exactly those three outcomes in that order. This removes a contradiction between the declaration contract and the provenance judgment algebra; `undetermined` is not silently treated as a malformed source operation or an unclaimed operation.

## Constraints preserved
- No scanner or runtime executor function bodies changed.
- Runtime authority interface migration remains a target contract; it is not claimed to be wired end-to-end.
- The legacy scanner fallback remains only as an explicit migration frontier for operations not claimed upstream.

## Verification
Passed: Phase 1515, 1516, 1517, 1519, 1520, 1522, 1525, and 1528 audits.
Build/typecheck status: not verified in this phase. The prior build attempt was blocked because `tsdown` was not installed in the workspace (`sh: 1: tsdown: not found`).
