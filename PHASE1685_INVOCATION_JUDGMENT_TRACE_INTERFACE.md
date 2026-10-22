# Phase 1685 — Invocation Judgment Trace Interface

## Goal

Settle the invocation semantic interface before migrating implementation wiring. The scanner should collect source-derived input, call the domain boundary, and forward the authority-validated judgment and proof trace. It must not interpret invocation semantics or rebuild trace information.

## Interface changes

- Added `InvocationSemanticJudgmentTraceContract` to make trace ownership and invariants explicit: subject identity, applicable rule coverage, source evidence lineage, witness ownership, obligation ownership, and closure/status correlation.
- Composed the trace contract into `InvocationSemanticPipelineContract`; pipeline contract version is now 7.
- Extended the high-level `InvocationSemanticPipelineInterface` with `analyzeKnowledge(knowledge)`, returning `InvocationSemanticAnalysis` with per-invocation judgments and traces.
- Preserved the semantic distinction between `analyzeInvocation`, `analyzeBatch` (independent requested inputs), and `analyzeKnowledge` (complete knowledge analysis).
- Exported the trace contract through the package public API and added a focused audit.

## Explicitly not migrated yet

This is still interface-first. `invocationSemanticRuntimeExecutor.ts`, `invocationSemanticJudgmentAuthority.ts`, and `controllerDataflowAnalyzer.ts` remain unchanged. The new pipeline interface is not yet the production runtime wiring; the next phase must implement the settled contract and then reduce scanner behavior to delegation.

## Architectural constraints preserved

- No dependency on `core/src/semantic/foundation`.
- No `any`, generic callable boundary, or generic `Function` abstraction introduced.
- Proof trace remains part of the domain judgment rather than a scanner-created side channel.

## Verification

See `PHASE1685_AUDIT.txt` for audit and focused TypeScript results. Full repository build is not claimed.
