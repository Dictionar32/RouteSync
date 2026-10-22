# Phase 1678 — Invocation Interface-First Pipeline Contract

## Purpose

This phase corrects the sequencing: define the missing contracts first; do not migrate algebra implementation, authority behavior, executor, scanner, or downstream wiring until the interface surface is reviewed and settled.

## Added interface surface

File: `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`

- `InvocationArgumentFormEvidenceInput`
- `InvocationArgumentFormJudgment`
- `InvocationArgumentFormEvidenceInterface`
- `InvocationSemanticBatchInput`
- `InvocationSemanticBatchJudgment`
- `InvocationSemanticBatchAuthorityInterface`
- `InvocationSemanticScannerBoundaryInterface`
- `InvocationSemanticPipelineContract`

## What this establishes

1. Argument-form knowledge is an explicit domain judgment (`positional-form-established` or `argument-form-unproven`), not merely nullable evidence.
2. An unproven argument form retains claim-specific evidence and a typed obligation.
3. Batch requests preserve one explicit input per invocation; the result ledger preserves invocation-to-judgment correspondence.
4. A dedicated batch authority contract is defined separately from the legacy knowledge-wide batch API.
5. Scanner-facing contract explicitly delegates single and batch work through the runtime executor.
6. Pipeline order and ownership are declared from source evidence through downstream projection. Evidence cannot be invented by algebra/scanner, phases must not reclassify prior judgments, and downstream must consume judgments rather than reconstruct semantics.

## Scope guard

This is an interface-only phase. It does **not** wire these contracts into current production implementation. The following files remain untouched by this phase:

- `invocationSemanticJudgmentAlgebra.ts`
- `invocationSemanticJudgmentAuthority.ts`
- `invocationSemanticRuntimeExecutor.ts`
- `semanticInterproceduralDataFlowRelations.ts`
- downstream projection implementations

The existing nullable `positionalEvidence` API and knowledge-wide legacy batch API remain in place temporarily. They are now identified as migration targets, not silently represented as already migrated. The next phase should continue interface review or, once the interface set is explicitly accepted, perform a separate wiring migration against these contracts.

## Verification

- Interface-only strict TypeScript check: passed for `invocationSemanticPipelineInterface.ts`.
- Interface audit: 14/14 checks passed.
- Full repository build: not run; this phase does not claim production wiring conforms to the newly declared contracts.
- No `any` added.
- No `core/src/semantic/foundation` dependency added.

## Changed files

- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts` (new)
- `packages/core/src/types/upstream/index.ts` (export only)
- `packages/core/src/index.ts` (public type/contract export only)
- `packages/core/scripts/audits/audit-phase1678-invocation-interface-first-pipeline.cjs` (new)
- `PHASE1678_INVOCATION_INTERFACE_FIRST_PIPELINE.md` (new)
