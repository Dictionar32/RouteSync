# Phase2958 — Source Inventory Predicate Retirement

## Trace

`controllerInvocationManifestBuilder.build(input)` → CLI manifest composition → `LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close(input)` → `judgeSourceIdentityUniqueness(sources)` → `sources.duplicateIdentities()` → `SourceFileInventory.continueWith(...)` → inventory closure judgment → manifest terminal result.

## Change

Removed the generic `filter(predicate: (sourceFile) => boolean)` operation from `SourceFileInventoryOperations` and from both empty and populated inventory runtime variants. The operation was a generic predicate escape hatch that let callers define arbitrary boolean filtering instead of using named domain operations. Duplicate identity selection continues through `duplicateIdentities()`, which uses `identityCardinalityAs()` and its domain ADT.

No new generic collection/helper abstraction was introduced. `packages/core/src/types/upstream/collections.ts` remains empty.

## Scope and verification

The new structural audit checks contract removal, runtime removal, retention of identity-cardinality and duplicate-identity domain operations, authority usage, test coverage presence, and the empty collections file. Structural audit is not a substitute for TypeScript typecheck or runtime tests.

Vitest, full typecheck, build, and CLI end-to-end are not claimed as passing unless run in an environment with project dependencies available.
