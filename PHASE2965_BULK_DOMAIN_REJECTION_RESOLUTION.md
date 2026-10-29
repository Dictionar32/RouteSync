# Phase2965 — Bulk Domain Rejection Resolution

## Trace

CLI manifest composition → `LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close(...)` → project-binding judgment → completeness judgment → source-identity judgment → correspondence judgment → one `validatedResult.withRejections(...)` domain transition → validated or rejected inventory ADT → manifest terminal outcome.

## Root-cause correction

Phase2964 removed `reduce()` but retained a mutable accumulator and repeated `includeRejection(...)` calls. That was only a mechanical change, not the intended domain model. Phase2965 removes the per-rejection accumulation API and replaces it with `LaravelControllerInvocationSemanticJudgmentInventoryRejectionResolution.withRejections(...)`, a single domain operation that resolves a complete rejection set. The validated and rejected variants own the transition; `close(...)` now supplies the four already-judged rejection groups once, in stable order.

No generic collection abstraction was introduced. Existing upstream contracts were inspected and evolved in place. `packages/core/src/types/upstream/collections.ts` remains empty.

## Verification

Run `npm run audit:phase2965-bulk-domain-rejection-resolution --silent` for the structural audit. This audit does not prove TypeScript type correctness or behavior. Full typecheck, tests, build, and CLI end-to-end remain unverified in this phase.

## Remaining boundary

This phase addresses rejection resolution in the inventory closure only. It does not claim repository-wide removal of `export function`, all array/index/undefined reasoning, or complete upstream CLI manifest migration.
