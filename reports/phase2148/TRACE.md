# Phase 2148 Trace — Request Binding Source Authority

## Before

`legacyLaravelControllerExecutionDependencies.actionJudgment.judge` called `scanControllerAction(...)`, then canonicalized request knowledge from `result.contract.request`. The request-kind decision therefore remained coupled to `resolveRequest(...)` in `controllerActionContract.ts`.

## After

The action semantic judgment now derives its canonical request knowledge from the original `ControllerMethodAst.parameters` inventory and the correlated FormRequest source index:

1. Wiring adapts each parameter's existing semantic tag and declared PHP type into typed evidence.
2. `LaravelControllerRequestSemanticBindingAuthorityInterface` owns selecting the first `request_origin` parameter.
3. The authority applies its explicit rule precedence: no request origin; matched FormRequest; matched framework Request; PHP type resolution; preserve unsupported/malformed as `typed_unresolved`.
4. The action judgment publishes the resulting canonical request binding.
5. Runtime executor forwards the same action judgment; it does not reclassify the request or upgrade coverage.

## Still open

`resolveControllerActionContract(...)` still derives request information used by the legacy schema/projection path, and `routeProducerRelations.ts` still reads the legacy action projection. This is explicitly tracked as `legacy_schema_request_binding_compatibility`, not claimed complete. `scanControllerAction(...)` remains in production.

## Verification boundary

Phase 2148 audit: 16/16 passed. Phase 2147 carry-forward audit: 13/13 passed. Six changed TypeScript files passed syntax-only transpilation. No full build, full typecheck, or Vitest run was performed.
