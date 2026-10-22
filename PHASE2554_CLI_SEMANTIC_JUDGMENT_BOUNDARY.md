# Phase 2554 — CLI Semantic Judgment Boundary

## Scope

This phase traces the active CLI path from `scan.ts` / `sync.ts` through manifest projection and request-type lowering. It adds a regression guard for the specific distinction between (a) an interface-valued legacy projection that returns `RequestType[]` and (b) the existing closed semantic authority contract that returns verified outcomes.

## Finding

The active CLI still calls `projectRouteSyncManifestForRouteManifest(...)`, which reaches `routeManifestTypeLowering.project(...)` and then `requestTypeDerivationProjectionPipeline.derive(...)`. That pipeline is backed by `requestTypeDerivationSolver`, which returns `readonly RequestType[]` and imports `packages/core/src/semantic/relations/relationalSequence`.

The upstream contracts already exist: canonical source inventory and occurrence identities, `RequestTypeDerivationJudgment` (`derived | incomplete | conflict | invalid_input`), semantic reasoning/verifier/decision/authority interfaces, pipeline assembler, and authority-backed lowering adapters. However, production source still has no concrete composition implementing source-bound reasoning plus complete 32-law proof verification and connecting it to the active CLI.

## Change

Added an executable audit that pins the active call path and fails if source changes accidentally describe the legacy array projection as a verified semantic judgment, or if a future implementation drops the closed judgment outcomes while wiring the CLI. This is a guardrail, not a substitute for the missing producer/verifier.

## What this phase does not claim

- It does not claim the active CLI is already fully interface-first.
- It does not wrap a bare `RequestType[]` in a fabricated `derived` judgment.
- It does not mark the 32 semantic laws verified without a verifier and receipts.
- It does not claim full typecheck, package build, or end-to-end CLI validation.

## Required root implementation still open

Implement the existing `RequestTypeDerivationSemanticReasoningInterface` and complete independent verifier against the existing proof/counterexample ADTs; assemble reasoning, verifier, decision, and authority against the canonical contract; then change the active manifest projection result to preserve every closed judgment outcome through the CLI. Only then retire the legacy `RequestType[]` solver path. See `packages/core/src/types/upstream/docs/PHASE2538_REQUEST_TYPE_PRODUCER_ROOT_CAUSE_RETRACE.md`.

## Validation

The audit is structural and syntax-level. `node_modules` is absent in this workspace snapshot, so no package typecheck, build, or Vitest result is claimed.
