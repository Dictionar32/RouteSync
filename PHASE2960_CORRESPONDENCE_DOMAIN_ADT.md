# Phase2960 — Correspondence Domain ADT

## Scope

Continue the upstream CLI manifest runtime audit from Phase2959. This phase narrows the work to `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts` and the correspondence closure path.

## Runtime trace

`controllerInvocationManifestBuilder.build(...)` → CLI manifest composition → `LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close(...)` → `reasoning.judgeJudgmentCorrespondence(...)` → source/judgment identity cardinality → correspondence rejection inventory → closed/rejected correspondence judgment → manifest closure result.

## Changes

- Replaced `sourceInventory.sources.toSourceFiles().reduce(...)` with recursive traversal through `SourceFileInventory.continueWith`, keeping the inventory in its domain representation during source partitioning.
- Replaced orphan judgment `flatMap` with a reduction that delegates identity cardinality to `identityCardinalityAs(...).continueWith(...)`.
- Added the local, domain-specific `CorrespondenceRejectionInventory` ADT with explicit empty/nonempty variants and `include` / `closeCorrespondence` operations. The terminal closed-vs-rejected decision now belongs to this ADT instead of `switch (rejections.length)`.
- Did not add a generic collection utility or a new upstream public contract. `packages/core/src/types/upstream/collections.ts` remains empty.
- Registered `audit:phase2960-correspondence-domain-adt`.

## Verification

- Phase2960 structural audit: 10/10 passed.
- Phase2958 source-inventory predicate-retirement audit: 10/10 passed.
- Phase2957 inventory-continuation uniqueness audit: 11/11 passed.
- TypeScript `transpileModule` syntax diagnostics for the changed authority: 0.
- Full `tsc --noEmit` was attempted but could not run as a meaningful project typecheck: the available global TypeScript compiler is older than the repository's configured target and the workspace has no installed `node` / `vitest/globals` type definitions. It emitted missing standard-library and type-definition errors before project-level validation.
- Vitest, full build, and CLI end-to-end were not verified in this phase.

## Remaining gaps

- `sourceFileRejections` remains a generic local helper.
- Some rejection accumulation still uses arrays as input/output evidence.
- Other upstream manifest runtime operations and remaining `export function` declarations across the wider repository have not been fully migrated.
- Full typecheck/test/build/CLI end-to-end remain unverified.
