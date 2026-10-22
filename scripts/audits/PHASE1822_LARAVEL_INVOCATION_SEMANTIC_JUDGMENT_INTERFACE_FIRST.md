# Phase 1822 — Laravel Invocation Semantic Judgment Interface-First

## Scope

This phase establishes an upstream-owned, source-correlated invocation judgment contract before changing scanner wiring. It is intentionally not a claim that `ControllerScanner` has been migrated or deleted.

## New contract

`packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts` defines a closed input ADT:

- `controller_invocation_pipeline_not_provided`: carries the controller `SourceFile` and yields an explicit `not_connected` integrated response.
- `controller_invocation_pipeline_provided`: carries the controller `SourceFile` and one whole-file `PhpSourceInvocationSemanticPipelineResult`.

The output keeps `SourceFile` and the exact `PhpSourceInvocationSemanticPipelineIntegrationResult` together. It does not flatten `complete`, `blocked`, source-binding rejection, or `not_connected` into a boolean/status string.

## Authority implementation

`laravelControllerInvocationSemanticJudgmentAuthority` composes the existing source-binding authority and integration authority. It does not resolve invocation targets, rebuild judgments, repair a rejected binding, perform batch index lookup, or join controller files to arbitrary pipeline entries.

## Trace result

The current production pipeline still calls `ControllerScanner.scanCanonicalBundle`, and route/resource consumers still depend on the legacy controller index. This phase therefore establishes the upstream interface and composition authority only. The next phase must change the production boundary to supply one source-correlated judgment per controller file, migrate route/resource consumers to the new judgment/artifact contract, audit zero production consumers, and only then delete the obsolete subscanner path.

## Validation

Run `node scripts/audits/audit-phase1822-laravel-invocation-semantic-judgment-interface-first.cjs` or `npm run audit:phase1822-laravel-invocation-semantic-judgment-interface-first`.

This audit is static. No build, typecheck, or E2E run is claimed.
