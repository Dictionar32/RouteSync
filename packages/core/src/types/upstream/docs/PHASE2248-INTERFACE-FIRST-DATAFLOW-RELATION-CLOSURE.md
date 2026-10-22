# Phase 2248 — Interface-first dataflow relation closure

## Result

The action semantic contract and production wiring are advanced together from version 40 to version 41. The existing `LaravelControllerActionSemanticJudgmentAuthorityInterface` now carries a distinct, typed `legacy_dataflow_relation_algebra` ownership obligation. This makes the transitive relation dependency explicit instead of implying that the scanner is relation-free after the subscanner bypass.

## Production trace

```text
CLI scan composition
  -> invocation semantic judgment
  -> LaravelControllerActionSemanticJudgmentAuthorityInterface.judge(...)
  -> resolveControllerActionContract(...)
  -> createControllerDataflowContract(...) [subscanners/controller]
       -> PHP AST recursive traversal
       -> ControllerResourceBindingAuthorityInterface.judge(candidate)
  -> published action judgment
  -> LaravelControllerActionExecutionInterface.execute(...)
  -> LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse(...)
  -> AST / manifest projection
```

The production path bypasses `scanControllerAction`, but it still reaches `resolveControllerActionContract` and `createControllerDataflowContract`. The latter imports `semantic/relations` for AST traversal and candidate construction. Separately, the canonical `controllerDataflowSemanticJudgmentAuthority` implementation also imports `semantic/relations` for source-correlation, binding, and payload judgment composition. Therefore, deleting only the subscanner import or changing only its location would not close the production path.

## Ownership boundary

Existing owners are retained:

- `ControllerDataflowSemanticJudgmentAuthorityInterface` owns source-correlated binding judgments, variable-flow composition, and integrated invocation-response composition.
- `ControllerResourceBindingAuthorityInterface` owns resource model-origin judgment, applicability judgment, and canonical publication.
- `LaravelControllerResponseSemanticPipelineInterface` owns integrated response publication.
- `LaravelControllerActionExecutionInterface` remains an executor/forwarder, not a semantic classifier.

No parallel semantic authority was added. The new obligation identifies the unresolved algebra/dependency migration and directs it toward existing typed judgment and source-evidence contracts. It does **not** claim that the current code is free of `semantic/relations` or subscanners.

## What remains open

1. The resource return-expression AST walk and candidate projection in `createControllerDataflowContract` still mix source evidence projection with semantic-flow assembly.
2. `controllerDataflowSemanticJudgmentAuthority` still depends on `semantic/relations`; its current source-identity, closed-judgment, and payload composition behavior must be preserved while the dependency is retired.
3. The action authority's coverage remains `action_semantic_knowledge_partial`.
4. The end-to-end CLI production path is not yet free of subscanner or relation dependencies.

The next implementation should first establish the exact typed source-evidence projection contract for returned resource expressions, then wire the existing resource authority and canonical dataflow authority through it. Do not delete `createControllerDataflowContract` until the resource bindings, source provenance, semantic variable flow, and response correlation are preserved by the canonical action judgment.

## Verification scope

Phase 2248 adds a structural audit for ownership/version alignment, the actual resolver-to-subscanner path, transitive relation imports, existing resource/response owners, and runtime forwarding. Structural audit success is not a substitute for TypeScript compilation or runtime tests.
