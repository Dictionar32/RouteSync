# Phase2879 — Invocation Judgment Preparation

## Observed gap

The existing `LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface.close` contract accepts a preassembled source inventory and judgments. It does not own the upstream domain preparation that analyzes complete source documents, delivers source-bound pipeline results, derives the invocation judgments, and constructs the matching source inventory. As a result, CLI composition performed three parallel projections with `.map()`.

## Change

Added the domain-specific `LaravelControllerInvocationSemanticJudgmentPreparationFactoryInterface` and `laravelControllerInvocationSemanticJudgmentPreparationFactory`. It composes the existing pipeline, delivery, and invocation-judgment authority contracts; it does not replace them or introduce a generic collection abstraction. The resulting preparation judgment exposes `continueWith` so the caller consumes a completed preparation through its domain operation.

CLI composition now delegates preparation and passes the resulting source inventory and judgments into the existing inventory closure authority. This removes the three identified `.map()` projections from `continueWithCompleteDocuments`.

## Boundaries and caveats

- The `.map()` used inside the upstream preparation operation is a data transformation over documents; it is no longer CLI-level orchestration. This phase does not claim that every `.map()` in the complete repository is an architectural defect.
- The new preparation judgment currently has a single complete outcome because it performs deterministic composition of already-complete documents and typed pipeline results. Pipeline blocked outcomes remain individual judgments and are not converted into an empty manifest.
- `packages/core/src/types/upstream/collections.ts` remains empty.
- Structural audit and TypeScript syntax parsing were run. Full project typecheck, build, and end-to-end tests were not verified.
