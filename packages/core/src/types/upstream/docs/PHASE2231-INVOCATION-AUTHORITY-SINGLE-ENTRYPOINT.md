# Phase 2231 — Invocation authority: one interface-first entry point

## Root cause

The existing invocation authority interface exposed three `judge` signatures: two overloads partitioned by input kind and one broad signature. The runtime implementation duplicated those overload declarations. That made the interface appear to express input/output semantic distinctions through overload selection instead of presenting the already-defined closed input ADT and closed judgment ADT as the authority boundary.

## Change

- Kept the existing `LaravelControllerInvocationSemanticJudgmentAuthorityInterface`; no parallel authority was introduced.
- Replaced overload-based API declarations with one `judge(LaravelControllerInvocationSemanticInput): LaravelControllerInvocationSemanticJudgmentInterface` contract.
- Kept the existing closed output ADT and its distinct `not_connected`, `source_binding_rejected`, `complete`, and `blocked` outcomes.
- Bumped the existing invocation semantic judgment contract version from 14 to 15 and recorded the single-entry-point rule.
- Updated the existing AST projection authority regression test to expect contract v15.
- Added a structural audit tracing the CLI source-AST orchestrator to the existing source-AST pipeline and then to the controller scanner.

## Authority and execution boundary

`LaravelControllerInvocationSemanticJudgmentAuthorityInterface` is the authority API. `LaravelControllerInvocationSemanticJudgmentAuthority` is its runtime implementation: it composes the existing source-binding and integration authorities and publishes the existing judgment ADT. The controller scanner consumes the closed invocation inventory and forwards the exact invocation judgment to the integrated response pipeline; it must not manufacture a second invocation judgment.

## Remaining migration debt — explicitly not claimed closed

This phase does **not** claim that the whole Laravel controller path is free of subscanner implementations. `laravelControllerExecutionDependencies.ts` still delegates action derivation to `scanControllerAction` and `resolveControllerActionContract`, and the action knowledge coverage still declares body-evidence derivation and resource-binding publication as open ownership obligations. Those are separate migration targets; renaming or relocating those implementations would not solve the authority problem. The canonical integrated response path remains the existing `LaravelControllerResponseSemanticPipelineInterface`.

## Validation boundary

The phase audit is structural. TypeScript type-checking, Vitest, and full build were not run in the supplied archive environment. The full build is intentionally not invoked.
