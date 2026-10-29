# Phase2953 — SourceFileInventory Identity Operation

## Trace

`controllerInvocationManifestBuilder.build(input)` → CLI manifest composition authority → source discovery and source-document reads → semantic judgment inventory closure → source identity uniqueness / judgment correspondence → manifest terminal judgment.

## Root issue

`SourceFileInventoryOperations.countMatching(predicate)` was a generic predicate utility. The manifest inventory authority used it to count source-file identities by repeatedly translating the source identity judgment into booleans. That placed identity interpretation in the consumer and made the inventory contract less domain-explicit.

## Change

- Replaced `countMatching(predicate)` with the domain-specific `countSameIdentityAs(sourceFile)` operation on the existing `SourceFileInventoryOperations` contract.
- The inventory delegates each comparison to the existing `laravelSourceIdentitySemantics.relateSourceFiles` judgment. It does not introduce a second source identity rule.
- Updated source identity uniqueness and orphan-judgment checks in `laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts` to use the inventory operation.
- Added tests for duplicate identity, distinct identity, and empty inventory.
- Kept `packages/core/src/types/upstream/collections.ts` empty.

## Remaining limits

This phase removes one generic predicate-counting path, not all predicate utilities, primitive thresholds, or `continueWith` dispatch from the repository. Full typecheck, full test suite, build, and CLI end-to-end were not run in this phase.
