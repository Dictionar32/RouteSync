# Phase2955 — Invocation Judgment Match Cardinality ADT

## Trace

`controllerInvocationManifestBuilder.build(input) -> controller invocation manifest composition -> source discovery/read -> LaravelControllerInvocationSemanticJudgmentAuthority -> LaravelControllerInvocationSemanticJudgmentInventoryAuthority.judgeJudgmentCorrespondence -> manifest terminal judgment`.

## Root-cause change

The correspondence authority previously converted each source identity relation into `true`/`false` callbacks and then counted matches. That flattened a domain identity judgment into a primitive predicate. The upstream inventory contract now declares `LaravelControllerInvocationJudgmentMatchCardinality`, a closed ADT with `no_invocation_judgment_matches_source`, `one_invocation_judgment_matches_source`, and `multiple_invocation_judgments_match_source` outcomes. Each outcome owns `includeRelation(...)` and `continueWith(...)` operations.

The authority folds the already-existing judgment-owned `relateSourceFileIdentity(...)` result into this ADT, then partitions missing and multiply-judged sources through the cardinality operation. It does not reconstruct identity semantics or use boolean handlers for source matching. Contract types are explicitly exported from `packages/core/src/index.ts`; no generic collection abstraction was added and `collections.ts` remains empty.

## Focused coverage

Added `packages/core/src/types/upstream/__tests__/laravel-controller-invocation-judgment-cardinality.phase2955.test.ts` for missing and duplicate matching judgments. The test was added but was not executed because this workspace has no local Vitest executable.

## Verification limits

The Phase2955 structural audit checks ADT operations, use of the existing identity relation, result partitioning, barrel exports, and the empty collections invariant. Syntax transpilation is not a full typecheck. The full typecheck was attempted but is blocked by the environment: the globally installed TypeScript compiler does not support the project ES2025 target/lib, and `@types/node` plus `vitest/globals` are unavailable. Vitest, full build, and CLI end-to-end remain unverified.
