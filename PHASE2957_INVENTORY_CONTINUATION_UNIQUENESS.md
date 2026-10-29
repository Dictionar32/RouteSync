# Phase2957 — Source Inventory Continuation and Identity Uniqueness

## Root cause

`SourceFileInventory` carried `empty` and `entry` variants and domain operations, but the inventory contract did not declare `continueWith`, even though the inventory authority already consumed `sources.continueWith(...)`. This left the runtime model and its declared upstream contract out of alignment. In addition, uniqueness classification used `switch (rejections.length)` to infer the domain result from a primitive collection size.

## Change

- Added `SourceFileInventoryHandlers<Result>` with `onEmpty` and `onSource` continuations.
- Added `continueWith` to `SourceFileInventoryOperations` and implemented it in both inventory variants.
- Changed source identity uniqueness to branch on `duplicates.continueWith(...)`, using the inventory ADT itself to distinguish no duplicates from duplicate entries rather than checking `rejections.length`.
- Added a focused test for both empty and populated inventory continuation.
- Kept `packages/core/src/types/upstream/collections.ts` empty.
- Added a structural audit and npm script for Phase2957.

## Trace

`controllerInvocationManifestBuilder.build(input)` → CLI composition → `LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close(input)` → `reasoning.judgeSourceIdentityUniqueness(inventory.sources)` → `inventory.sources.duplicateIdentities()` → `duplicates.continueWith(...)` → unique or duplicate identity judgment → manifest closure result.

## Verification boundaries

The structural audit is intended to verify contract and source shape. A successful syntax transpilation does not establish a full TypeScript typecheck. Vitest, full typecheck, build, and CLI end-to-end must be reported only if actually run.
