# Phase 2250 — Upstream-First Laravel Scanner Retirement Trace

## Intent

This phase is a source-trace checkpoint, not a claim that the subscanner has already been retired. The governing order is upstream contract and semantic judgment first, production wiring second, runtime executor last. `semantic/relations`, `semantic/foundation`, and controller subscanners are not acceptable new owners for semantic reasoning.

## Current production trace

```text
CLI scan composition
  -> LaravelControllerActionSemanticJudgmentAuthorityInterface.judge
  -> resolveControllerActionContract
  -> createControllerDataflowContract
       -> PHP return-expression AST traversal
       -> ControllerResourceBindingAuthorityInterface.judge
  -> published LaravelControllerActionSemanticJudgment
  -> LaravelControllerActionExecutionInterface.execute
  -> LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse
  -> AST / manifest projection
```

## Upstream contracts to reuse

- `ControllerDataflowSemanticJudgmentAuthorityInterface`: source-correlated binding/identity/variable-flow judgment and invocation response composition.
- `ControllerResourceBindingAuthorityInterface`: the sole owner of resource applicability, closed resource judgment, and publication.
- `ControllerBodySemanticJudgmentAuthorityInterface`: body judgment.
- `ControllerDependencySemanticJudgmentAuthorityInterface`: constructor/method dependency judgment.
- `ControllerReturnSemanticProductionInterface`: current return-semantic production boundary; implementation is still backed by `controllerAstCanonical`.
- `LaravelControllerResponseSemanticPipelineInterface`: integrated-response owner.
- `LaravelControllerActionExecutionInterface`: forwards an already-published judgment; it must not classify or repair it.

No parallel semantic authority should be introduced for these responsibilities.

## Verified open edges

1. `packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts` imports and calls `createControllerDataflowContract` from `subscanners/controller/controllerDataflowContract.ts`.
2. `controllerDataflowContract.ts` still performs recursive AST traversal to create resource candidates and imports `semantic/relations` helpers.
3. `controllerDataflowSemanticJudgmentAuthority.ts` also imports `semantic/relations`; deleting the subscanner import alone cannot close the dependency.
4. `laravelControllerExecutionDependencies.ts` still imports controller producer / AST canonicalization from `subscanners/controller`.
5. The Phase 2249 `ControllerResourceReturnSourceEvidenceProjectionInterface` is exported upstream, but the production action composition does not yet inject and consume it. Declaration alone is not migration.
6. The published action coverage remains `action_semantic_knowledge_partial`; this phase does not relabel it as closed.

## Required migration order

1. Evolve existing upstream contracts so the action judgment has complete, source-correlated return-resource evidence and closed resource outcomes.
2. Wire the existing resource authority through the production action composition. Keep the projection boundary syntax-only; keep semantic applicability in `ControllerResourceBindingAuthorityInterface`.
3. Migrate the existing dataflow authority away from `semantic/relations` without creating a second authority or moving the same semantic runtime into a renamed file.
4. Cut the CLI production path over to those existing upstream judgments.
5. Verify output parity for variable flow, resource binding, provenance, invocation judgment, and integrated response.
6. Only then retire `resolveControllerActionContract`, `createControllerDataflowContract`, and the controller subscanner dependencies from the production path.
7. Audit transitive production imports for both `semantic/relations` and `semantic/foundation`. Do not claim global removal based on a controller-only grep.

## Completion criterion

The retirement is complete only when the production CLI path consumes a complete upstream action judgment and integrated-response contract, runtime execution is forwarding-only, and no production dependency reaches controller subscanners, `semantic/relations`, or `semantic/foundation` for this path. This checkpoint does not meet that criterion.
