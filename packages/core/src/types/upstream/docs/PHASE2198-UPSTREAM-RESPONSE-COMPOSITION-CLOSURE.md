# Phase 2198 — Upstream Response Composition Closure

## Objective

Clarify the existing upstream interface before changing scanner/runtime call paths. The integrated response pipeline must consume the exact evidence producer and method-response projection selected by its complete dependency contract; a module-level singleton must not silently replace those dependencies during execution.

## Changes

- Evolved `LaravelControllerResponseSemanticPipelineDependenciesInterface` to carry the existing `LaravelControllerResponseEvidenceProductionInterface` and `LaravelControllerMethodResponseAstProjectionInterface`.
- `judgeIntegratedResponse` now calls `dependencies.evidenceProduction.produce(...)`, not a hidden module-level `evidenceProduction` singleton.
- Added `createLaravelControllerMethodResponseAstProjection(outputTypeJudgment)`. The method projection and the output-type judgment it executes are now one composed contract.
- Added `outputTypeJudgment` to `LaravelControllerMethodResponseAstProjectionInterface`; pipeline's public `responseOutputTypeJudgment` is projected from that exact dependency, not an independently selected authority.
- Composition root binds the defaults; `createLaravelControllerResponseSemanticPipeline` consumes the complete dependency bundle.
- Bumped pipeline contract version 27 → 28 and added contract obligations for evidence producer and method projection dependency identity.
- Updated the existing DTO projection test to assert the current contract version and the dependency identity relationships.

## Trace findings

The previous phase closed response-authority/executor identity but left two composition leaks: evidence production was called through a module-level constant inside `judgeIntegratedResponse`, and method AST projection called a module-level output-type judgment. This meant the dependency interface was not the full authority over integrated response composition.

## Remaining limitations

- Default concrete authorities remain intentionally bound at the composition root.
- Parser compatibility defaults and transitively captured concrete dependencies outside this pipeline are not claimed to be fully removed.
- Full TypeScript typecheck, Vitest, and package build were not run in this phase.
