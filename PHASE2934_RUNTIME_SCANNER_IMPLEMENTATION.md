# Phase2934 — Runtime Scanner Implementation

## Implemented changes

1. Evolved the existing `SourceFileInventoryOperations` contract in `packages/core/src/types/upstream/names.ts` with `toSourceFiles(): readonly SourceFile[]`. The ADT now exposes an explicit domain projection of its ordered source evidence rather than requiring effect-only traversal for every consumer.
2. Implemented `toSourceFiles` for both inventory variants. The empty variant returns an immutable empty sequence; the entry variant returns an immutable ordered sequence preserving inventory order.
3. Migrated production source-selection classification in `laravelRouteSourceSelection.ts` to consume `toSourceFiles()` instead of using `visitSources` callbacks.
4. Migrated the Laravel route scanner's scheduled source reads to consume the inventory's typed projection rather than a visitor callback.
5. Added a regression test for ordering and empty-inventory behavior.

## Existing contracts reused

No new upstream interface was introduced. The change evolves the existing `SourceFileInventoryOperations` contract. `ManifestBuilderJudgment` already exposes `continueWith`; its complete/blocked distinction and AST/source-model blockers were preserved unchanged. `packages/core/src/types/upstream/collections.ts` was not modified.

## Remaining work / limitations

- `laravelRouteScanner.ts` still distinguishes the blocked source-observation arm from the ready arm using `sourceObservation.kind`. A follow-up should evolve `LaravelRouteSourceObservationJudgment` with a domain continuation that executes the read plan only for the ready arm and preserves the exact blocker for the blocked arm.
- `visitSources` remains for compatibility with existing tests and consumers; it was not removed globally.
- No `export function` declarations were changed outside the specific runtime scanner path because this pass targets the traced scanner/manifest pathway, not unrelated project-wide functions.

## Verification

Attempted `tsc --noEmit -p tsconfig.json`. It could not execute a meaningful project typecheck because this extracted workspace has no installed project dependencies and the globally available TypeScript compiler is older than the repository's configured `ES2025` target. It reported missing standard library/type packages (`node`, `vitest/globals`) and unsupported compiler options before validating the project. Tests were not run for the same missing-dependency reason. No passing test/typecheck claim is made.
