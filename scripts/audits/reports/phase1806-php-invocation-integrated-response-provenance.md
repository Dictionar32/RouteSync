# Phase 1806 — PHP Invocation Integrated-Response Provenance (Interface-First)

## Trace finding

The whole-file PHP invocation pipeline already returns a closed discriminated result (`complete` or `blocked`). However, `phpSourceInvocationSemanticPipelineIntegration.project()` reduced every blocked result to the same legacy pending state. The controller scanner then passed only that projected state to the integrated-response composition. As a result, the integrated response could not retain the exact source-pipeline result or identify the blocking stage, even though the upstream pipeline had already modeled that information.

## Interface-first change

- Added `PhpSourceInvocationSemanticPipelineCompositionEvidence`, a closed union distinguishing an ordinary scanner call path with no source pipeline from a call path carrying the exact `PhpSourceInvocationSemanticPipelineResult`.
- Evolved `InvocationSemanticIntegratedResponseCompositionInput` so callers supply this source-pipeline evidence, rather than supplying a separately projected PHP invocation state that could disagree with the source pipeline.
- Evolved `InvocationSemanticIntegratedResponse` to retain the exact source-pipeline evidence in the same aggregate as the PHP invocation integration state and semantic publication result.
- Evolved integrated-response composition contract from v13 to v14.
- Moved the projection choice into the existing upstream composition: connected evidence is projected by the existing pure integration interface; the explicitly unconnected path keeps the existing pending state.
- Updated the Laravel scanner to forward the discriminated evidence only. It no longer calls the source-pipeline projection itself.

## Example of the new contract shape

```ts
export type PhpSourceInvocationSemanticPipelineCompositionEvidence =
  | Readonly<{
      readonly kind: 'php_source_invocation_pipeline_not_connected';
    }>
  | Readonly<{
      readonly kind: 'php_source_invocation_pipeline_connected';
      readonly result: PhpSourceInvocationSemanticPipelineResult;
    }>;
```

The integrated response retains this evidence, so a blocked result such as `frontend_coverage` or `invocation_batch_closure` is not erased merely because the compatibility projection remains `pending`.

## Boundaries preserved

- No new semantic authority or duplicate pipeline was introduced.
- No name resolution, invocation classification, or judgment derivation moved into the scanner.
- The scanner only forwards a typed source-pipeline union; the existing upstream integration and composition interfaces own projection.
- No dependency on `semantic/foundation` or `semantic/relations` was added to these upstream contracts.
- No parser implementation or whole-file AST coverage is claimed. A real whole-file PHP AST frontend adapter remains outstanding.
- Obsolete subscanners are not removed until their consumers have been migrated and audited.

## Static verification

- Phase 1806 integrated-response provenance audit: **12/12 passed**.
- Phase 1805 frontend traversal audit: **16/16 passed**.
- Phase 1804 invocation syntax inventory regression audit: **16/16 passed**.
- Phase 1803 frontend coverage witness regression audit: **12/12 passed**.
- Build/typecheck intentionally not run.

## Remaining work

1. Implement a real whole-file PHP AST frontend adapter that can truthfully produce the v3 traversal witness and source inventories.
2. Wire the validated frontend into the existing source pipeline with a concrete, source-bound name-resolution authority.
3. Prove the invocation judgment batch is correlated with the same source document before promoting integrated invocation coverage.
4. Migrate remaining expression-mapping consumers off the legacy subscanner, audit imports, then retire the obsolete subscanner.
