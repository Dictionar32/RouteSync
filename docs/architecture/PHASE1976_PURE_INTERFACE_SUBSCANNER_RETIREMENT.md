# Phase 1976 — Pure Interface Subscanner Retirement Contract

## Scope

This phase changes the retirement declaration only. It does not edit any scanner, parser, authority, executor, resolver, AST projection, or wiring implementation.

## Trace finding

`laravelSubscannerRetirementInterface.ts` previously contained a type declaration and a runtime registry (`const` domain objects and `LARAVEL_SUBSCANNER_RETIREMENT_CONTRACT`). That registry was a runtime value, not a pure interface. It repeated retirement facts in a constructed object and made a type-level migration map look like an additional runtime boundary.

## Interface-only correction

- Keep `LaravelSubscannerRetirementDomain` as a closed discriminated union describing each legacy entry and its existing upstream ownership boundary.
- Keep `LaravelSubscannerRetirementInterface` as a pure interface describing the retirement gate and domain coverage.
- Remove the runtime registry and its value export. No runtime consumer used that value inside this repository; only the package barrel re-exported it.
- Do not introduce a new replacement subscanner, `relation` layer, or `foundation` layer.
- Do not delete the existing legacy scanner directory in this phase. The interface records the zero-production-consumer gate; migration and deletion are separate future work after explicit consumer trace.

## Existing semantic path

Invocation semantic judgment remains owned by the existing `LaravelControllerInvocationSemanticJudgmentInterface` and integrated-response composition contracts. The AST pipeline/scanner interfaces remain the existing source-AST boundary. This phase adds no parallel judgment, response, or AST model.

## Validation boundary

The audit is structural only. TypeScript compilation and build were not run.
