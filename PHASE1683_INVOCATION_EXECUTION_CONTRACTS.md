# Phase 1683 — Invocation Execution Contracts (Interface First)

## Scope

This phase continues the interface-first sequence. It settles the cross-boundary contracts for invocation semantic authority and runtime execution before migrating any implementation or wiring. The phase intentionally does not change the algebra implementation, authority implementation, runtime executor implementation, scanner, or downstream consumers.

## Source inspection findings

The existing source has a high-level algebra boundary (`derive(input)`), a canonical judgment contract, an authority interface, a runtime executor interface, and a pipeline interface. However, the pipeline previously composed only the judgment and algebra contracts. Authority validation ownership and runtime delegation semantics were not structurally composed into the pipeline contract. Also, runtime `executeAll(knowledge)` is an aggregate analysis, distinct from pipeline `analyzeBatch(inputs)`, which is one result per input.

## Changes

- Added `invocationSemanticExecutionBoundaryContract.ts` with a canonical authority-boundary contract and runtime-executor contract.
- The authority contract structurally binds the exact canonical judgment contract and the high-level algebra boundary contract.
- The runtime contract states delegation ownership, distinguishes single-input execution from aggregate knowledge analysis, and explicitly forbids semantic derivation responsibilities in the executor.
- Composed both contracts into `InvocationSemanticPipelineContract`; contract version advanced from 4 to 5.
- Exported the new contract types and constants through the upstream barrel and public core package index.
- Updated prior phase static audits whose expected pipeline version became stale.
- No generic callable boundary, `any`, or dependency on `core/src/semantic/foundation` was introduced.

## Explicitly not migrated yet

- `invocationSemanticJudgmentAlgebra.ts` still uses the internal staged algebra implementation.
- `invocationSemanticJudgmentAuthority.ts` still calls `analyzeInvocationJudgmentAlgebra` directly.
- `invocationSemanticRuntimeExecutor.ts` still delegates to the existing authority interfaces.
- Scanner and downstream wiring remain unchanged.

These are deliberately left untouched because this phase establishes contracts first. Their migration belongs to the subsequent wiring phase after the interface surface is reviewed and accepted.

## Verification

- Phase 1680 audit: 13/13 passed.
- Phase 1681 audit: 12/12 passed.
- Phase 1682 audit: 17/17 passed.
- Phase 1683 audit: 15/15 passed.
- TypeScript strict check passed for the algebra boundary, execution boundary contracts, and pipeline interface.
- Full repository build and end-to-end behavior are not claimed.
