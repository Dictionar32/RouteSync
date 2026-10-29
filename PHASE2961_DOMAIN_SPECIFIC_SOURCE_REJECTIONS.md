# Phase2961 — Domain-Specific Source Rejection Operations

## Scope
Continues Phase2960 in `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts`.

## Change
Retired the generic `sourceFileRejections<Rejection>(sources, createRejection)` mapper. Replaced it with three explicitly domain-named traversals:

- `duplicateSourceRejections`
- `missingInvocationJudgmentRejections`
- `multipleInvocationJudgmentRejections`

Each traversal takes the existing `SourceFileInventory` ADT and constructs the corresponding rejection variant with an explicit discriminant. The callers no longer supply generic callbacks to define the rejection domain. This is a targeted removal of one generic helper, not a claim that every generic abstraction or every `export function` in the repository has been migrated.

The Phase2960 correspondence ADT remains in place: its empty/nonempty states expose `include` and `closeCorrespondence`, and source correspondence continues to traverse `SourceFileInventory` through `continueWith`. `packages/core/src/types/upstream/collections.ts` remains empty.

## Runtime path trace
CLI manifest scan/composition → `LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close(...)` → `reasoning.judgeSourceIdentityUniqueness(...)` / `reasoning.judgeJudgmentCorrespondence(...)` → source identity cardinality and domain-specific rejection traversal → correspondence ADT `closeCorrespondence(...)` → inventory validated/rejected result.

## Verification
- Phase2961 structural audit: 10/10 passed.
- Phase2960 correspondence ADT audit: 10/10 passed.
- Phase2959 rejection tuple audit: 11/11 passed.
- TypeScript `transpileModule` syntax diagnostics for the modified authority: 0.
- `collections.ts`: 0 bytes.
- Package JSON parsed successfully as part of the audit.

Full typecheck, Vitest, full build, and CLI end-to-end execution were not verified in this phase. Structural audits and syntax transpilation do not establish full type correctness or runtime correctness.

## Remaining gaps
- Rejection accumulation still uses arrays at some boundaries.
- Orphan judgment collection still uses `reduce`.
- Repository-wide `export function` migration is incomplete.
- Full typecheck/tests/build/CLI E2E remain unverified.
