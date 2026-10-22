# Phase 2008 — Resource Output Shape Judgment, Interface First

## Trace finding

Phase 2007 already consumed the canonical `ResponseResult` ADT, but resource responses and JSON resource payloads remained unresolved even when the upstream resource scanner had produced a resolved `ResourceDefinition`. The response output-type interface also accepted only `ResponseResult`, so it had no contractually valid way to consume resolved resource shape knowledge.

## Contract-first change

The existing `LaravelControllerResponseOutputTypeJudgmentInterface` now receives a closed input containing the canonical `ResponseResult` and the resolved `ResourceDefinition` inventory. The existing `LaravelControllerMethodResponseAstProjectionInterface` receives the same inventory through its typed projection input. No second resource classifier or response authority was added.

The existing `LaravelControllerResponseSemanticPipelineInterface` and contract advance to version 11. The output-type judgment contract advances to version 2, and the AST projection contract advances to version 2.

## Resource output rule

A resource output shape is proven only when:

- exactly one resolved `ResourceDefinition` matches the canonical `ResourceReference`;
- the resource has no dynamic entries;
- no custom response customization, `with`, or `withResponse` extension changes the output shape;
- every resource field has a closed `TypeExpression` rather than `mixed` or an error type.

The result is a typed object whose properties preserve each field's source span and type. Fields whose presence is conditional are optional; fields that become null when unavailable are nullable. Resource collection cardinality produces an array of that object type.

A missing or ambiguous resource definition, dynamic field output, or open/customized resource shape remains explicitly unresolved. It is not guessed from the model name.

## Pagination boundary

Paginated resource output remains unresolved. Laravel's paginated resource envelope carries `data`, `links`, and `meta`, and resource-level pagination customization can change the envelope. The current `ResponseResult` does not yet contain a closed, customization-aware pagination envelope contract. This phase deliberately does not invent one from `PaginationKind` alone.

## Integrated flow

The source AST pipeline now runs the existing resource scanner before response AST projection and passes only its resolved resource definitions to `scanResponseBundle`. The response scanner still consumes canonical per-method response products; it does not reopen or reclassify controller PHP syntax.

No `relation` or `foundation` subscanner was added. Existing legacy references elsewhere in the project were not claimed to be removed.

## Verification limits

The Phase 2008 audit checks the interface input, versioned contracts, resolved-resource shape rules, pipeline ordering, canonical product wiring, and conservative pagination boundary. TypeScript syntax transpilation was checked for the four changed TypeScript files. Full project typecheck/build is not claimed to pass because the available global TypeScript compiler cannot resolve the project's configured ES2025 libraries and Node/Vitest type definitions.
