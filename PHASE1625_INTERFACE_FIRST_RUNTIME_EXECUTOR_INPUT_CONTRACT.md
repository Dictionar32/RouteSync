# Phase 1625 — Interface-first runtime executor input contract

## Change

The runtime executor port and result algebra now live in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`, not beside the runtime implementation. The port carries `TInput extends RequestTypeDerivationInput` as a generic. Its `execute` argument and the `expectedInput` witness in `input_binding_failed` retain that exact input type. The factory derives `TInput` from `TInference['input']`, instead of widening the public executor boundary to the base `RequestTypeDerivationInput`.

## Architecture boundary

This is a contract-level preservation change, not a semantic authority move. The executor still consumes the upstream pipeline and dispatches its already-established authority assessment. Runtime envelope checks remain because static TypeScript types do not validate plugin or serialized values crossing runtime boundaries. The `proofInput` witness remains the base domain input because it is decoded from the returned runtime assessment.

## Trace

- Upstream inference packet: `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` preserves contract, input, and judgment generics.
- Canonical pipeline: `RequestTypeDerivationSemanticPipelineInterface<TContract, TInference>` exposes `derive(TInference['input'])`.
- Runtime executor: the public `execute` boundary now preserves `TInference['input']` rather than widening it.
- Scanner wiring: the existing route-manifest type-lowering wiring remains a consumer of the canonical pipeline; no scanner classification or semantic reasoning was moved.

## Validation

Run `node scripts/audits/audit-phase1625-runtime-executor-input-contract.cjs`. The type-level Vitest test is added but requires the project's Vitest dependencies to execute. A targeted TypeScript check reports the same two executor integrity-branch diagnostics and the same scanner `judgment` implicit-any diagnostic as the baseline before this phase; no new diagnostics were introduced in those touched paths. A full build is not claimed because dependencies are not installed.
