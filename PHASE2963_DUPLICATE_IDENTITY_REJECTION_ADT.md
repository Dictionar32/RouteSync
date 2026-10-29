# Phase2963 — Duplicate Identity Rejection ADT

## Scope

This phase tightens `judgeSourceIdentityUniqueness` in `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts`.

Previously, the method collected duplicate rejections into an array, then selected `rejections[0]` using a type assertion and sliced the remainder. The branch was already guarded by `duplicates.continueWith({ onSource })`, which proves that a first duplicate exists.

The updated implementation consumes that proof directly: `onSource(firstDuplicate, remainingDuplicates)` constructs the first domain rejection, traverses the remaining duplicate inventory, and builds the non-empty rejection tuple. It removes the unsafe first-element assertion and slice without adding a generic collection abstraction or changing the public upstream contract.

## Runtime trace

`laravelControllerInvocationSemanticJudgmentInventoryAuthority.close(...)` → `reasoning.judgeSourceIdentityUniqueness(...)` → `sources.duplicateIdentities()` → `SourceFileInventory.continueWith(...)` → `inventoryRejections(firstRejection, remainingRejections)` → `source_identity_duplicates_found`.

## Verification

The phase audit checks the explicit first-duplicate proof, domain rejection kind, recursive remainder traversal, removal of the unsafe cast/slice, interface-first authority export, and empty `packages/core/src/types/upstream/collections.ts`.

Syntax transpilation and ZIP integrity are separate checks. This report does not claim a full project typecheck, Vitest run, full build, or CLI end-to-end test unless those are run successfully in the project environment.
