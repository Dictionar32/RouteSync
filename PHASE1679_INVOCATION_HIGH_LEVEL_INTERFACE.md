# Phase 1679 — Invocation High-Level Interface

## Scope

This phase corrects the public invocation pipeline boundary to avoid low-level interface proliferation. It does not migrate algebra implementation, authority implementation, runtime executor, scanner, or downstream wiring.

## Changes

- Replaced the Phase 1678 collection of low-level public interfaces (`InvocationArgumentFormEvidenceInterface`, `InvocationSemanticBatchAuthorityInterface`, and `InvocationSemanticScannerBoundaryInterface`) with one domain-level `InvocationSemanticPipelineInterface`.
- The public pipeline interface exposes complete invocation analysis and batch analysis, not individual target-resolution, argument-binding, effect-projection, or closure methods.
- Batch output preserves an explicit invocation-to-judgment association and declares order/identity/proof-isolation invariants.
- The contract makes source evidence ownership, authority validation, closure semantics, scanner delegation, and downstream consumption explicit.
- Updated the package public index to export the high-level interface and its domain result types rather than the low-level interfaces.

## Verification

- Phase 1679 interface audit: 12/12 passed.
- Focused TypeScript strict check for `invocationSemanticPipelineInterface.ts`: passed.
- Full repository build: not run.
- Production wiring and runtime behavior: intentionally unchanged and not claimed to satisfy the new high-level contract yet.

## Boundary

This is an interface-design phase. The new high-level interface is a target contract for a later wiring migration; it is not yet an implemented end-to-end pipeline. The existing algebra's staged interface remains an implementation concern and is not exposed as the high-level pipeline API by this change.
