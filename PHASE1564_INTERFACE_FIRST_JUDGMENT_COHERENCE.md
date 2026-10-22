# Phase 1564 — Interface-first judgment/closure coherence

## Goal

Strengthen the upstream semantic model before touching scanner wiring or the runtime executor. The contract must make it difficult to represent an outcome that contradicts its proof status.

## Trace finding

`requestTypeDerivationInterface.ts` already had separate `derived`, `incomplete`, and `conflict` judgment variants, and a separate `closed`, `incomplete`, and `conflicted` closure union. However, each judgment accepted the entire proof type. The type boundary therefore allowed a `derived` judgment to carry an incomplete/conflicted closure, and allowed incomplete/conflict payload ledgers to be empty or disagree with the proof ledger. The verifier had no dedicated failure reasons for these coherence violations.

## Interface changes

- Added `RequestTypeDerivationProofFor<Kind>` to correlate each judgment variant with its matching closure variant.
- Added `RequestTypeNonEmptyLedger<T>` for outcomes that claim unresolved evidence or conflicts.
- Added `RequestTypeUnresolvedRouteReceipt`, narrowing its disposition to `unresolved`.
- Added a conflict ledger to the proof itself. A conflicted proof requires a non-empty conflict ledger; non-conflicted proof variants require an empty ledger.
- Added `outcomeCoherence` policy laws: closure/result coherence, group output correspondence, and equality between judgment ledgers and proof ledgers.
- Added verification reasons for judgment/closure mismatch, output mismatch, unresolved-ledger mismatch, and conflict-ledger mismatch.
- Kept the interface declaration-only. No runtime policy object, scanner behavior, authority implementation, or executor was changed.

## Trace targets intentionally unchanged

- `packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts`
- `packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts`
- `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts`

These remain downstream migration targets after an authority implementation can produce and verify judgments conforming to the strengthened contract.

## Validation scope

The audit script checks the presence and shape of the semantic contract statically. It does not prove runtime verification behavior, compiler acceptance, a full package build, or test-suite success.
