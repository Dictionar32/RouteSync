# RouteSync Phase 2409 — Response Attribute Product Closure Trace

## Scope

Continue the Phase2408 route-boundary work by tracing the existing response-attribute evidence producer, DTO declaration resolution, response semantic judgment, and route-boundary consumer. This phase intentionally does not fabricate a production projection where the upstream contract does not yet provide one.

## Trace findings

1. `LaravelControllerScannerExecutor` constructs `ControllerActionJudgmentPublication` before calling `judgeIntegratedResponse`. The publication carries canonical action judgment and source provenance, not a complete route-facing response product.
2. `produceResponseEvidence` publishes `response_attribute_source` evidence. This is parsed source evidence, not a resolved DTO contract or an HTTP response result.
3. `resolveDtoDeclarationJudgments` uses the existing `PhpClassNameResolutionRuleInterface` and `LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface` against the closed project DTO inventory. It preserves resolved, unresolved, and ambiguous outcomes.
4. DTO property references and DTO-to-`ResponseContract` projection are already handled by their existing upstream authorities. Those products are retained as response semantic evidence.
5. The response evidence coverage still explicitly lists `resolved_response_attribute_descriptor` and `response_dto_declaration` as missing evidence, while the response authority can publish method response products only when the canonical `ControllerReturnSemantic` proves a concrete `ResponseResult`.
6. The active route path still supplies `VoidResponseDescriptor.create()` to resource and standard targets. `routeBoundaryContractFromRouteFacts` then copies that compatibility descriptor into its route producer input. The route consumer therefore does not consume the integrated response judgment as its response contract.

## Root cause

The gap is not a missing DTO lookup. Existing DTO declaration and projection authorities are already wired. The missing operation is the **source-correlated response-attribute-to-method-response product composition** that can establish, for each exact canonical method, how the resolved DTO response contract relates to the method's canonical return semantics and produce a closed route-facing response result. A DTO declaration alone does not prove that the method returns that DTO or that it represents an HTTP response.

## Required evolution of existing contracts

Evolve the existing `LaravelControllerResponseSemanticPipelineInterface` and its evidence/product contracts. Do not create a second DTO resolver, response authority, or runtime lookup.

The existing pipeline must publish a closed per-method ADT with:

- exact canonical method/action identity and source span;
- the resolved DTO declaration judgment and its project identity;
- the DTO-to-`ResponseContract` projection judgment;
- the canonical return-semantic judgment;
- an explicit complete or blocked outcome when those products cannot be composed without inference.

Then wire that product into the existing route-boundary composition operation and route producer. Only after the new product is actually consumed and regression-verified should the `VoidResponseDescriptor` compatibility path be retired. Do not infer a successful response from attribute presence, DTO name, or an empty/default descriptor.

## Phase status

This phase is a trace/closure-gate artifact, not a production implementation. No production source was changed because the existing public contracts do not yet express the required per-method composition outcome, and manufacturing one from current fields would misstate semantic authority. No claim of end-to-end interface-first closure is made.

## Validation boundary

The accompanying audit is structural only. TypeScript typecheck, package build, Vitest, and live scan/sync CLI were not run.
