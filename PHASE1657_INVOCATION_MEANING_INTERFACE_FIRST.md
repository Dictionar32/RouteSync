# Phase 1657 — Invocation Meaning Interface-First

## Scope

This phase continues from Phase 1656 and raises `InvocationSemanticJudgmentInterface` from a mostly execution-rule catalog to an explicit domain meaning contract.

## Changes

- Added `InvocationSemanticMeaningModel` to `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`.
- Declared invocation identity, target cardinality/ambiguity, positional argument-to-parameter correspondence, result/exception effects, evidence provenance, and closure semantics in the upstream meaning model.
- Exposed the same meaning model directly on `InvocationSemanticContract`; bumped the public contract version to 13.
- Updated `invocationSemanticJudgmentAlgebra.ts` to read result/exception kinds and closure/target-cardinality conditions from the semantic model rather than hard-coding those decisions at the projection sites.
- Kept the runtime executor as pure delegation and scanner invocation analysis as a single executor call.
- Added `audit:phase1657-invocation-meaning-interface-first` and updated the existing invocation audit for contract version 13.

## Verification

- Phase 1657 static boundary audit: 9/9 passed.
- Existing invocation semantic-model audit: 14/14 passed.
- Full TypeScript/build verification is blocked in this workspace: dependencies are not installed (`node_modules`, `tsdown`, and Vitest are absent). The globally available TypeScript compiler is older than the repository's configured TypeScript version and cannot type-check this project configuration.

## Explicit remaining issue

This phase does **not** claim the generic `semanticJudgmentRuleCompiler.ts` law-kind registry has been eliminated. The invocation pipeline still uses the generic `evidence-backed-identity`, `uniqueness`, and `ordered-correspondence` lowering path. That remains the next architectural blocker; merely moving those templates into an invocation-specific compiler would not satisfy the intended model-first design. The semantic meaning contract is now explicit and partly authoritative, but the relation-engine derivation path still needs a deeper redesign before the whole request can be considered complete.
