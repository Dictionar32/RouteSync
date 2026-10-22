# Phase 2214 — Response Product Correlation Cutover Guard

## Trace baseline

Baseline: `RouteSync-Phase2213-Response-Pipeline-Contract-Version-Closure.zip`.

The controller scanner currently executes the action judgment before constructing the full `ControllerDeclarationEvidence`. It later invokes `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` with that declaration evidence, the exact invocation judgment, the complete DTO declaration inventory, and the source-project identity. The resulting integrated response judgment is retained on the controller scan artifact and passed unchanged with the invocation judgment to the existing AST projection authority.

The action path still calls `scanControllerAction` and `resolveControllerActionContract`, whose response descriptor resolution reaches `resolveResponseAttributeAst`. Therefore, the controller-level response pipeline and action-level legacy descriptor are parallel representations today. The existence of DTO declaration and DTO `ResponseContract` projection judgments does not by itself prove that a particular method's compatibility descriptor can be replaced.

## Interface-first contract change

`LaravelControllerActionSemanticJudgmentContract` version 24 now declares `responseProductCorrelationRule`. It requires exact canonical method evidence and source-span correlation before a controller response product can replace an action-level compatibility descriptor. A project-wide DTO projection inventory is context, not proof of action-level ownership.

The rule is carried by the existing action authority contract in `laravelControllerExecutionDependencies.ts`. No new semantic authority, foundation, relation layer, or subscanner was introduced.

## Runtime and judgment boundaries

- `InvocationSemanticAuthorityInterface.analyze` owns the PHP invocation judgment.
- `InvocationSemanticRuntimeExecutorInterface.execute` forwards the individual invocation judgment; batch execution delegates to its batch authority.
- `InvocationSemanticIntegratedResponseCompositionInterface.integrate` remains distinct from Laravel HTTP response judgment.
- `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` owns the integrated Laravel response judgment.
- `LaravelControllerAstProjectionSemanticAuthorityInterface` receives the exact invocation/response judgment pair and projects it without rebuilding either judgment.
- `LaravelControllerActionExecutionInterface.execute` forwards the complete action judgment and does not upgrade its partial coverage.

## Remaining cutover blockers

1. `scanControllerAction` / `resolveControllerActionContract` still produce the action-level response descriptor.
2. No proven adapter yet correlates each method's response product to the exact action descriptor's method evidence and source span.
3. The controller-level integrated response judgment is currently retained as a controller artifact, not consumed as a replacement for the action descriptor.
4. `semantic/relations` usage and the channel client-subscription evidence gap remain separate trace items.

The correct next implementation is to prove and encode per-method product correlation through existing response and AST projection contracts, then compare compatibility projections for parity. Do not remove `resolveResponseAttributeAst` until that proof exists.

## Verification scope

The phase test checks contract-version coherence and the explicit correlation rule. Typecheck, full Vitest, and package build are not claimed as run.
