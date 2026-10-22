# Phase 1868 — Resource Binding Batch-State Interface First

## Trace findings

- `packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts` already represents closed output as exact `ResourceModelBindingSubjectJudgment` pairs, but its authority contract did not expose a canonical correspondence operation.
- `packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts` owned a standalone `const judgmentForSubject(...)` helper and used it to correlate fixed-point and cycle states.
- `packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts` independently searched `bindingBatch.bindings` and raised its own missing-correspondence error. That left subject lookup behavior duplicated across semantic closure and scanner projection.
- The invocation-integrated controller judgment is already retained on source-correlated controller artifacts. The resource semantic model already declares that it consumes the complete controller scan and forbids detached/reconstructed invocation responses.

## Interface-first changes

1. Added `ResourceModelBindingBatchStateSemanticsInterface` to `resourceModelBindingSemanticInterface.ts`. Its contract explicitly defines exact canonical subject-object identity, subject coverage, per-subject judgment equivalence, and ordering as non-semantic for state equality.
2. Added the declarative `RESOURCE_MODEL_BINDING_BATCH_STATE_SEMANTICS_IDENTITY` and made it part of `ResourceModelBindingSemanticJudgmentModelInterface`; the semantic model contract version is now 6.
3. Extended `ResourceModelBindingJudgmentAuthority` to expose the batch-state contract and `bindingForSubject`; authority contract version is now 5.
4. Replaced the standalone `judgmentForSubject` helper with the typed runtime realization of the upstream batch-state interface. Fixed-point equality and cycle comparison now delegate through that interface.
5. Changed the Laravel resource scanner to request the exact subject binding from the binding authority instead of searching the returned bindings itself. Scanner projection no longer owns correspondence policy.
6. Added `scripts/audits/test-phase1868-resource-binding-interface-first.cjs` and registered `audit:phase1868-resource-binding-interface-first`.

## Verification

- `npm run audit:phase1868-resource-binding-interface-first`: **7/7 passed**.
- `node --check scripts/audits/test-phase1868-resource-binding-interface-first.cjs`: passed.
- `package.json` JSON parse: passed.
- Controller integrated-response preservation audit `audit-phase1838-controller-integrated-response-preservation.cjs`: **8/8 passed**.
- No full build or TypeScript compilation was run.

## Explicitly not claimed

This phase does **not** retire `semantic/relations` or all of its existing consumers. The resource-binding authority and scanner still have pre-existing imports from that subsystem; those require a separate interface-first migration and dependency trace before the directory can safely be emptied. This phase introduces no dependency on `semantic/foundation` and does not claim static invocation support beyond the existing contract.
