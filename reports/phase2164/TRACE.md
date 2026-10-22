# Phase 2164 Trace

## Existing flow

`ControllerMethodAst.responseAttribute` → `LaravelControllerScannerExecutor` → existing `ControllerProducer.projectMethodEvidence` → `ControllerMethodEvidence.responseAttribute` → existing `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` → evidence production/source binding → existing response semantic authority/executor → AST projection.

## Defect fixed

Before this phase, `response_attribute_source.source` was populated from `methodEvidence.source`, which is the whole method declaration span. The parsed attribute had no source token span of its own. This obscured provenance precision at the existing interface boundary.

## Remaining architectural gap

`controllerActionContract.ts` still calls `resolveResponse()`, which delegates declared DTO resolution and observed-value merging to `responseAttributeScanner.ts`. `judgeResponse()` consumes `observation.action.semantic.returned` when constructing method return semantics; the newly preserved attribute evidence is not yet the sole authority for descriptor/DTO derivation. This phase does not claim that legacy ownership has been retired.
