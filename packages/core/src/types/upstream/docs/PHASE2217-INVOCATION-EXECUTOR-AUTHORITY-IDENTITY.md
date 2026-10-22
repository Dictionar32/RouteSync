# Phase 2217 — Invocation Executor Authority Identity

## Trace finding

The invocation runtime executor already exposed the individual authority's contract and the batch authority's contract, and its `execute` / `executeAll` functions delegated to the corresponding authorities. However, the public executor interface exposed neither authority instance. The batch owner was only described by a string-valued delegation rule and a contract value. A matching contract identity is not itself proof of which authority instance owns a call.

## Change

The existing `InvocationSemanticRuntimeExecutorInterface` now exposes:

- `invocationAuthority: InvocationSemanticAuthorityInterface`
- `batchAuthority: SemanticInterproceduralDataFlowAuthorityInterface`

The runtime composition publishes the exact instances passed to the factory and delegates directly to those same instances. `contract` and `batchContract` remain derived from their respective authority instances. No semantic logic was moved into the executor.

## Authority boundaries preserved

- `InvocationSemanticAuthorityInterface.analyze` owns one PHP invocation judgment.
- `SemanticInterproceduralDataFlowAuthorityInterface.analyze` owns whole-knowledge batch analysis.
- The executor owns neither judgment; it only forwards calls.
- `InvocationSemanticIntegratedResponseCompositionInterface.integrate` remains distinct from `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse`.
- Laravel HTTP response judgment remains separate from PHP invocation judgment.

## Scanner trace retained

The Laravel action production adapter still delegates through `scanControllerAction` / `resolveControllerActionContract`; this phase does not claim that legacy action derivation is retired. `semantic/relations` is still used by existing controller subscanner implementation files, including `controllerAstCanonical.ts`, `resourceInvocationDetector.ts`, `controllerDataflowContract.ts`, `responseDetector.ts`, and `responseAttributeScanner.ts`. These call sites were recorded, not replaced with a new relation/foundation/subscanner layer.

## Verification limits

The phase adds regression tests for authority instance identity and direct delegation. Full typecheck, Vitest, and package build are not claimed as passing; no package build was run.
