# Phase 1823 — Laravel Invocation Judgment Model Separation

## Intent

The prior Phase 1822 contract mixed the semantic judgment value and the callable authority boundary in `LaravelControllerInvocationSemanticJudgmentInterface`. This phase separates those responsibilities before production wiring changes.

## Model changes

- `LaravelControllerInvocationSemanticJudgmentInterface` now represents only the closed judgment value: its discriminant, contract version, canonical `SourceFile`, and lossless `PhpSourceInvocationSemanticPipelineIntegrationResult`.
- `LaravelControllerInvocationSemanticJudgmentAuthorityInterface` separately owns the callable `judge` operation and its contract.
- `LaravelControllerInvocationSemanticJudgment` remains a public type alias for the judgment value.
- The semantic contract advances to version 2 and explicitly requires source identity and integrated response to be one value.
- `LaravelControllerScanArtifact` now carries `invocationJudgment`, not a detached `invocationResponse` plus duplicate artifact source identity. The judgment is the single canonical source-identity owner for this correlated result.
- The authority continues to delegate provenance validation and integration projection to their existing upstream authorities; it does not reconstruct invocation semantics.

## Trace and known gap

`packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` still calls `ControllerScanner.scanCanonicalBundle`. `RouteScanner` still consumes the legacy controller action `RelationIndex`, and resource derivation still depends on the legacy controller index. Therefore this phase does **not** claim production migration or subscanner deletion.

## Audit

Run `npm run audit:phase1823-laravel-invocation-judgment-model-separation`.

This is a static source-contract audit only. Build, typecheck, and E2E were not run.

## Next interface-first migration

Implement the upstream `LaravelControllerScannerInterface` against this judgment model, then change route/resource consumers to receive correlated controller judgments. Only after production references to legacy controller/action indexes reach zero and audits pass should the obsolete subscanner path be deleted.
