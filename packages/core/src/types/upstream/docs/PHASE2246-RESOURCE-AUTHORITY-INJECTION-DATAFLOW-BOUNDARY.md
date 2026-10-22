# Phase 2246 — Resource Authority Injection and Dataflow Boundary

## Change

The legacy `createControllerDataflowContract` path no longer imports the concrete `controllerResourceBindingAuthority` singleton. It receives the existing `ControllerResourceBindingAuthorityInterface` through `ControllerDataflowContractInput` and calls `resourceBindingAuthority.judge(...)` for each AST-derived candidate.

The same existing authority is supplied at the two current composition sites:

- `resolveControllerActionContract(...)`, via `ControllerActionContractResolverContext` and the production wiring.
- `controllerMethodSemanticProjectionFromMethod(...)`, via the existing `controllerAstCanonical.ts` projection path.

The legacy `actionScanner.ts` compatibility path and the focused resolver tests also provide the existing authority explicitly. No new resource semantic authority was introduced.

## Ownership clarification

The typed `legacy_dataflow_resource_projection` obligation now identifies the target as the combination of:

- `ControllerDataflowSemanticJudgmentAuthorityInterface`: canonical source-correlated dataflow judgments and variable-flow composition.
- `ControllerResourceBindingAuthorityInterface`: resource-binding semantic judgment and canonical publication.
- An AST evidence-projection boundary: source syntax is translated into typed candidate evidence before the resource authority is called.

The action contract and production wiring advance to version 40. Coverage remains partial.

## Production trace

```text
CLI composition
  -> LaravelControllerScanner
  -> action semantic judgment authority
  -> resolveControllerActionContract
  -> createControllerDataflowContract
  -> AST candidate projection
  -> injected ControllerResourceBindingAuthorityInterface.judge
  -> action judgment publication
  -> LaravelControllerActionExecutionInterface
  -> LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse
  -> AST / manifest projection
```

The separate canonical body-dataflow path remains:

```text
controllerBodyParser
  -> analyzeControllerDataflowWithInvocationJudgment
  -> ControllerDataflowSemanticJudgmentAuthorityInterface.derive
  -> closed source-correlated dataflow judgment
```

The canonical dataflow analyzer is already used by `ControllerDataflowAst`; this phase does not pretend that it replaces the separate legacy return-expression/resource-binding projection.

## Explicitly unresolved

- `controllerDataflowContract.ts` still imports `semantic/relations` and performs recursive AST traversal.
- The action path still calls `createControllerDataflowContract` from a `subscanners/controller` module.
- The AST candidate projection boundary is not yet an injected projection interface.
- No claim is made that the transitive Laravel scanner path is free of `relation` or `foundation`.
- Integrated response ownership and runtime executor behavior are unchanged.

## Verification

The phase audit checks authority injection, both call sites, contract version alignment, existing canonical dataflow/resource authorities, invocation-to-response continuity, and explicit retention of the relation/subscanner debt. It is a structural audit, not a TypeScript compilation or full test-suite result.
