# Phase 2159 — CLI-to-Response Ownership Trace

## Scope

This phase traces the existing RouteSync ZIP from CLI entry points through manifest composition, Laravel controller scanning, per-action response descriptor derivation, integrated response judgment, and response consumers. It does not claim the production response ownership gap is closed.

## CLI trace

- `packages/cli/src/commands/scan.ts` and `sync.ts` call `buildManifestWithInvocationPipeline(...)`.
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` discovers controller PHP files, creates source documents, obtains invocation judgments, closes the source-to-judgment inventory, and calls `manifestBuilder.build(...)` only with the validated receipt.
- `packages/cli/src/commands/generate.ts` consumes an existing manifest through `CompilerBridge.emitFullBundle(...)`; it does not rescan Laravel source.
- Therefore response meaning must be closed before manifest projection; the generator should not repair Laravel semantics.

## Controller scanner trace

`LaravelControllerScannerExecutor.scanControllers` currently performs these steps:

1. Parse each source tied to an exact invocation judgment.
2. Close controller declaration selection.
3. Call `executionDependencies.actionJudgment.judge(...)` for each selected action.
4. `legacyLaravelControllerExecutionDependencies.actionJudgment.judge` calls `controllerRequestBindingJudgmentFromMethod(...)`, then `scanControllerAction(...)`.
5. `resolveControllerActionContract(...)` calls `resolveResponse(...)`, obtains `response.semanticPresence`, and passes it to `controllerReturnSemanticFromMethod(...)`, `createControllerDataflowContract(...)`, and `ControllerActionContract.semanticResponse`.
6. After action projections are built, the scanner invokes `responseSemanticPipeline.judgeIntegratedResponse(...)` with the exact invocation judgment and declaration evidence, then passes that response judgment with the same invocation judgment to AST projection and publishes both in `LaravelControllerScanArtifact`.

## Important distinction

The integrated response pipeline is genuinely wired into the scanner artifact, but its evidence production still receives per-method action response facts. It emits both `observed_controller_return` evidence and a `controller_action_response_reference_candidate` derived from `methodEvidence.action.response`. That candidate is evidence, not proof of a PHP return response.

At the same time, the per-action legacy resolver sets `semanticResponse` directly from `ResponseDescriptor.semanticPresence`. `resolveResponse` maps an absent response attribute to `VoidResponseDescriptor.create()`. This means the descriptor's `response_absent` currently means “no descriptor/reference was supplied” in this path, while downstream `ControllerResourceBindingAuthority` interprets `response_absent` as a reason to leave resource binding unresolved.

The current behavior is conservative for resource binding, but the type name conflates *declaration/reference availability* with *actual HTTP return semantics*. This is the main upstream contract gap; merely adding `semanticPresence` to descriptors does not close it.

## Upstream contracts already available

- `LaravelControllerActionSemanticJudgmentInterface` publishes canonical action knowledge but its `semantic.response` is still projected from the legacy `ControllerActionContract.semanticResponse`.
- `LaravelControllerResponseSemanticPipelineInterface` already owns integrated controller response judgment and the exact invocation correlation.
- `LaravelControllerReturnResponseProjectionInterface` projects the existing `ControllerReturnSemantic` ADT into `ResponseResult` or an explicit unresolved outcome without reparsing PHP syntax.
- `ControllerResourceBindingAuthorityInterface` already owns resource/model/response-reference correlation, but it currently consumes `ControllerResponse` and treats `response_absent` as unresolved.

## Recommended upstream-first correction

Do not add another authority, relation/foundation layer, or subscanner. Evolve the existing contracts in this order:

1. Separate **response declaration/reference evidence** from **canonical HTTP return judgment**. Do not use `ControllerResponse.response_absent` to mean “response attribute not declared”.
2. Extend the existing response judgment ADT with an explicit unresolved declaration/reference outcome where necessary, preserving the difference between absent declaration, proven no-content return, and unresolved response.
3. Evolve `ControllerResourceBindingAuthorityInterface` to consume the response-reference judgment it actually needs, rather than a conflated controller response-presence fact. Keep its current ownership of the resolved resource/model/response correlation.
4. Use the existing `LaravelControllerReturnResponseProjectionInterface` for canonical return-to-`ResponseResult` projection. Keep `LaravelControllerResponseSemanticPipelineInterface` as the owner of integrated, source-correlated response judgment.
5. Publish the exact action response judgment in `LaravelControllerActionSemanticJudgmentInterface`; route/manifest projections should consume it without reclassification.
6. Keep `scan`/`sync` as wiring and `generate` as manifest projection only.

This requires a deliberate ADT/API migration because `ControllerResponse` is consumed across controller dataflow and route projections. A blind global rename or replacing `matchResponse` with another helper would not solve the semantic distinction.

## Validation limits

This phase performs static trace checks only. No production TypeScript was changed. Full build, full typecheck, and Vitest were not run.
