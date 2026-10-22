# Phase 1730 — Correspondence Identity Ownership

## Interface-first trace

Trace began at `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts` and followed the inventory entry, publication entry, correspondence receipt, coverage contract, and Laravel scanner boundary. The production scanner consumer remains `packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts`, which delegates whole-knowledge analysis to `invocationSemanticPipeline.analyzeKnowledge(...)`.

## Interface evolution

- `InvocationSemanticCoverageContract` v22 → v23 now states the identity invariant for a correspondence receipt: its identity is derived from the canonical inventory subject and must match the publication subject and any published judgment subject.
- `InvocationSemanticPipelineContract` v38 → v39 carries the strengthened coverage contract.
- `LaravelControllerInvocationSemanticBoundaryContract` v17 → v18 explicitly prohibits scanner recomputation or repair of correspondence identity.
- No new identity fields were added to inventory/publication entries. The subject remains the canonical owner of form, KnowledgeId, and source evidence.
- No production wiring or runtime semantic classifier was changed. This is deliberately interface-first, not a claim that the publication authority already enforces the contract.
- `core/src/semantic/foundation` is not referenced.

## Verification boundary

The phase audit checks contract synchronization and identity ownership only. The actual inventory/publication authority and its runtime validation remain unimplemented; this phase does not claim end-to-end coverage publication.
