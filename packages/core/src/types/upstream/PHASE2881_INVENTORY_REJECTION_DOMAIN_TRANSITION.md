# Phase2881 — Inventory Rejection Domain Transition

## Purpose

Remove result-discriminator reasoning from the inventory authority's rejection aggregation by giving the inventory judgment ADT an explicit, domain-specific transition operation.

## Before

`laravelControllerInvocationSemanticJudgmentInventoryAuthority.close` collected all independent rejection evidence, then folded it with a `switch (result.kind)` to decide whether a validated inventory should transition to a rejected result or an existing rejection ledger should be extended.

That decision belonged to the inventory judgment, not to the aggregation caller.

## Change

- Added `LaravelControllerInvocationSemanticJudgmentInventoryRejectionAccumulation`.
- Added `includeRejection(rejection)` to both validated and rejected inventory judgments.
- A validated judgment transitions to a rejected judgment with a non-empty rejection ledger.
- A rejected judgment appends the next independent rejection while preserving prior ledger entries.
- `close` now folds rejections through `result.includeRejection(rejection)` rather than branching on `result.kind`.
- Bumped inventory contract and result `contractVersion` from 11 to 12 because the public judgment operations changed.
- Exported the operation contract type through the core public type barrel.
- Kept `packages/core/src/types/upstream/collections.ts` empty.

## Runtime trace

`controllerInvocationManifestCompositionAuthority.compose`
→ invocation judgment preparation
→ `laravelControllerInvocationSemanticJudgmentInventoryAuthority.close`
→ project binding / completeness / source uniqueness / judgment correspondence evidence
→ inventory judgment's `includeRejection` transition for each rejection
→ `continueWith` routes validated inventory toward manifest preparation or rejected inventory toward the rejection terminal.

## Why this is not a generic collection abstraction

`includeRejection` is attached to this domain's validated/rejected inventory judgment and accepts only `LaravelControllerInvocationSemanticJudgmentInventoryRejection`. It is not a generic sequence or collection ADT.

## Verification

- Phase2881 structural audit: 10/10 checks passed.
- Phase2880 interface-first delivery audit: 11/11 checks passed.
- Phase2879 invocation preparation audit: 12/12 checks passed.
- TypeScript parser syntax diagnostics: 0 for the modified contract, authority, and core barrel.
- Full project typecheck was attempted with the globally installed TypeScript 5.8.3 but could not run successfully because project dependencies/type definitions are absent and the repository config uses `ES2025`, unsupported by that compiler version. This is an environment/toolchain limitation; type correctness, build, and end-to-end behavior are not claimed as verified.
