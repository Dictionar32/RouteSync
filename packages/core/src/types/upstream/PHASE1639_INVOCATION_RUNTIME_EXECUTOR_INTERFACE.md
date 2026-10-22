# Phase 1639 — Invocation Runtime Executor Interface

## Ownership boundary

`InvocationSemanticJudgmentInterface.ts` is the contract surface: one typed invocation input produces exactly one discriminated `InvocationSemanticJudgment` (`closed` or `incomplete`) with evidence, rule trace, and unresolved obligations.

`InvocationSemanticJudgmentAlgebra.ts` owns semantic derivation, obligation formation, and closure. `InvocationSemanticJudgmentAuthority.ts` binds the algebra to `InvocationSemanticAuthorityInterface`. `InvocationSemanticRuntimeExecutorInterface` defines the runtime boundary, and `invocationSemanticRuntimeExecutor.ts` only delegates `execute(input)` to the upstream authority. The scanner facade re-exports the boundary; it must not recreate semantic rules or decide closure.

## Important remaining frontier

The single-judgment algebra entry point currently calls the aggregate algebra and then selects the requested judgment. The new runtime executor is intentionally thin, but this does **not** yet make semantic evaluation proportional to one invocation. A later algebra change should derive the requested judgment directly while preserving the same proof, trace, evidence, and missing-invocation obligation contract. Do not claim that performance improvement until it is implemented and regression-tested.

## Verification

Run `npm run audit:phase1639-invocation-runtime-executor-interface` from `packages/core`. This is a static ownership/wiring audit, not a substitute for the full TypeScript build and tests.
