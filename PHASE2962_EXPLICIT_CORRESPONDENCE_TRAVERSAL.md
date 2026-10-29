# Phase2962 — Explicit Correspondence Traversal

## Scope

This phase continues the upstream CLI manifest correspondence audit in `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts`. It does not introduce a new upstream contract because the existing `LaravelControllerInvocationJudgmentMatchCardinality`, `SourceFileInventory.identityCardinalityAs`, and `CorrespondenceRejectionInventory` operations already cover the domain responsibilities being changed.

## Changes

- Replaced `judgments.reduce(...)` for source-to-judgment cardinality with the named `judgeSourceJudgmentCardinality(...)` traversal, preserving the existing cardinality ADT's `includeRelation(...)` and `continueWith(...)` operations.
- Replaced orphan-judgment `reduce(...)` with `judgeOrphanJudgments(...)`, using the existing source inventory's `identityCardinalityAs(...).continueWith(...)` operation.
- Replaced `map(...)` for orphan rejection construction with `includeOrphanJudgmentRejections(...)`, which submits each domain-specific rejection through `CorrespondenceRejectionInventory.include(...)`.
- Replaced `reduce(...)` in `includeCorrespondenceRejections(...)` with explicit recursive traversal that continues the existing rejection ADT operation.
- Preserved rejection ordering: missing source judgments, multiple judgments per source, then orphan judgments.
- Kept `packages/core/src/types/upstream/collections.ts` empty.

## Runtime trace

CLI manifest scan/composition → `LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close(...)` → `reasoning.judgeJudgmentCorrespondence(...)` → source inventory identity cardinality + judgment match cardinality ADT → `CorrespondenceRejectionInventory.include(...)` → `closeCorrespondence(...)` → closed/rejected correspondence judgment.

## Verification boundaries

The structural audit is run via `npm run audit:phase2962-correspondence-explicit-traversal`. TypeScript syntax is checked with the globally available TypeScript `transpileModule` API. These checks do not prove full type correctness or behavioral correctness. Full typecheck, Vitest, build, and CLI end-to-end remain unverified in this phase.
