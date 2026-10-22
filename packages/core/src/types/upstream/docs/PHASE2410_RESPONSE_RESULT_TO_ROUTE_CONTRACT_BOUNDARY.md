# RouteSync Phase 2410 — Response Result / Route Contract Boundary

## Purpose

Continue from Phase2409 by checking whether the existing canonical per-method response product can be connected directly to the route producer without inventing semantic meaning or retaining a second response classifier.

## Source trace

1. `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` can publish `controller_response_method_products_complete`. Each `LaravelControllerMethodResponseProduct` carries the canonical method return semantic, a typed `ResponseResult`, and DTO contract projection judgments owned by that method.
2. The product is produced after the controller action judgments are assembled. The controller scan artifact retains the integrated response judgment, but the route scanner currently receives only the action-flow list and action-judgment publications for route target construction.
3. `laravelRouteScanner.ts` constructs one `VoidResponseDescriptor.create()` and passes it to resource and standard route targets.
4. `routeProducerRelations.ts` copies the target's `ResponseDescriptor` into `RouteBoundaryOptions`; it does not consume a response judgment or per-method response product.
5. `ResponseResult` is a transport/HTTP result ADT (`branches`, `content`, `redirect`, `no_content`, `resource`, `responsable`, `json_serializable`). The route compatibility `ResponseDescriptor` ADT is a different abstraction (`resource`, `model`, `inline`, `void`) with schema/body analysis functions. They are not isomorphic. A total conversion cannot be inferred from the current types without an explicit projection judgment and blocked cases.
6. DTO `ResponseContract` projections are typed DTO declaration contracts. They are retained as method-owned provenance on the response product, but their presence alone does not prove the method's actual HTTP result or supply all fields required by `InlineResponseDescriptor`.

## Root cause

There are two disconnected boundaries, not one missing function call:

- **ownership/wiring gap:** route construction does not receive or correlate the controller's integrated response judgment;
- **projection-contract gap:** no existing closed operation states when a canonical method `ResponseResult` plus its method-owned DTO contract can be projected into the route's legacy `ResponseDescriptor`, or why projection is blocked.

A direct cast, guessed `void` descriptor, response-attribute-name mapping, or a DTO-only conversion would conceal this gap rather than close it.

## Required production evolution

Evolve the existing `LaravelControllerResponseSemanticPipelineInterface` with a source-correlated route-response projection operation, or evolve its existing method-response product contract to include that operation if ownership remains coherent. The operation must consume the canonical method product and its already-owned DTO projection judgments, and return a closed ADT:

- a complete route-facing response projection retaining exact method/action identity and source provenance;
- or an explicit blocked result naming the unproven projection obligation.

The route scanner must correlate the route target through the existing upstream correlation authority and consume this result. The route-boundary contract must carry the projection judgment (or a route-facing contract whose provenance retains it), rather than silently replacing it with `VoidResponseDescriptor`. All downstream consumers of `ResponseDescriptor` must be traced before deciding whether that compatibility type can be retired or must remain as a derived projection.

Do not add a parallel DTO resolver, a duplicate response authority, a `foundation` dependency, or a new subscanner. Do not claim CLI closure until the same method-owned projection is shown to reach the CLI manifest/IR consumer.

## Validation boundary

This phase adds a source trace and structural audit only. No production source changed: the existing types do not define the projection's complete/blocked semantics, and guessing a conversion would be incorrect. The audit checks source boundaries, not runtime behavior. Full typecheck, Vitest, package build, and live scan/sync CLI are not run.
