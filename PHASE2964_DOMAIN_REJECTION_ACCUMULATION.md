# Phase2964 — Domain Rejection Accumulation

## Scope

This phase continues the upstream CLI manifest inventory-closure audit from Phase2963. It reuses the existing `LaravelControllerInvocationSemanticJudgmentInventoryResult.includeRejection(...)` domain operation rather than creating a new collection contract.

## Change

In `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts`:

- Added a domain-specific `includeInventoryRejections` operation that feeds each rejection to the inventory-result ADT's `includeRejection` operation.
- Removed the combined rejection array built with spread syntax in `close`.
- Removed the final `rejections.reduce(...)` accumulation.
- Kept rejection group ordering stable: project binding, completeness witness, source identity, correspondence.
- Preserved the interface-first authority export.
- Kept `packages/core/src/types/upstream/collections.ts` empty.

This is a bounded change: it removes the combined intermediate rejection collection but does not claim that every array/index-based judgment traversal or every `export function` declaration has been migrated.

## Runtime trace

`CLI manifest composition` → `LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close(...)` → project-binding judgment → completeness judgment → source-identity judgment → correspondence judgment → `includeInventoryRejections(...)` → `result.includeRejection(...)` → validated/rejected inventory result → manifest terminal result.

## Verification

- Phase2964 structural audit: 10/10 checks passed.
- Phase2963 structural audit: 10/10 checks passed.
- Phase2962 structural audit: 10/10 checks passed.
- TypeScript `transpileModule` syntax diagnostics for the changed authority: 0.
- `packages/core/src/types/upstream/collections.ts`: 0 bytes.
- Full project typecheck, Vitest, full build, and CLI end-to-end were not run; they are not claimed as passing.

## Remaining gaps

- Some judgment traversals still use array indices and `undefined` checks.
- Some domain results still contain arrays at contract boundaries.
- Repository-wide `export function` migration is incomplete.
- Full behavioral verification remains outstanding.
