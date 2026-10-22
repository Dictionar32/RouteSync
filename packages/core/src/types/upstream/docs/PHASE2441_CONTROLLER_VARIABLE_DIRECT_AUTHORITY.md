# Phase 2441 — Controller Variable Direct Authority

## Root cause

The Laravel controller data-flow definition projection depended on `ControllerVariableSemanticRuntimeExecutorInterface`. Its implementation accepted a semantic resolution request and did nothing except call `authority.resolve(request)`. The wrapper introduced a second callable contract without owning semantic reasoning, execution state, or a distinct operation.

## Change

- `PhpControllerDataflowDefinitionProjectionAuthority` now depends on `ControllerVariableSemanticAuthorityInterface` and calls `semanticAuthority.resolve(...)` directly.
- Scanner wiring injects `controllerVariableSemanticAuthority` directly.
- Removed `ControllerVariableSemanticRuntimeExecutorInterface`, its pass-through implementation, and its barrel export.
- Removed the test that asserted the existence of the redundant wrapper. Existing authority tests continue to test semantic resolution directly.
- Removed the parameterized `SemanticTypeDerivationRuntimeExecutor` wrapper. The `SemanticTypeDerivationAuthority` now admits/validates its own closed judgment before exposing it.
- Replaced `SemanticTypeDeriver.run()` (a no-argument closure that captured a context and deferred semantic derivation) with an already-computed `judgment` field. The semantic result is now computed at the upstream boundary, not hidden behind a runtime call.

## Boundary distinction

The source-evidence projection still accepts its typed `input`, and the semantic authority still accepts a typed resolution request. These are required data-bearing boundaries, not runtime executors being given parameters to finish semantic reasoning. This phase removes only the redundant delegation layer; it does not claim every runtime executor or dispatch function in RouteSync has been removed.

## Remaining audit targets

The following runtime wrappers remain and need independent ownership/value review before removal:

- `invocationSemanticRuntimeExecutor.ts` — delegates `execute` to `InvocationSemanticAuthorityInterface.analyze` and `executeAll` to `SemanticInterproceduralDataFlowAuthorityInterface.analyze`.
- `semanticDataflowRuntimeExecutor.ts` — composes the authority with a judgment-admission boundary, including a no-evidence outcome.
- `laravelDtoTypeReferenceBindingAuthority.ts` and `laravelDtoResponseContractProjectionAuthority.ts` — expose runtime-named contracts that require separate tracing of their callers and ownership.

These are not automatically equivalent: proof admission or explicit operation composition may be real responsibilities. Do not delete them merely because their names contain `RuntimeExecutor`.
