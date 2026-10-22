# RouteSync Phase2413 — Integrated Response to Route AST

## Production changes

Phase2413 changes the active route AST response projection instead of adding an unused sidecar:

- `EndpointResponseBinding` now has `controller_method_response`, carrying the existing method-owned `LaravelControllerMethodResponseProduct` without converting `ResponseResult` into a legacy `ResponseDescriptor`.
- The same ADT has `controller_response_projection_blocked` with closed reasons. An unmatched action, ambiguous action/product, invalid publication provenance, unavailable response judgment, unsupported response product, or closure without correlated controller response no longer becomes an apparently successful `empty_response`.
- `laravelRouteScanner.ts` correlates route declarations through the existing `controllerActionRouteCorrelationAuthority`, then selects a method response product by controller identity, action identity, and exact source span.
- `RouteProducerInputCompositionInput` now requires `responseProjection`; the existing composition operation forwards that ADT directly into `RouteBindings.response`.
- The route response relation model accounts for both new ADT variants without fabricating a route-response relation for a blocked result.

## Authority and operation ownership

Invocation Semantic Judgment and Integrated Response remain owned by the existing controller scan and `LaravelControllerResponseSemanticPipelineInterface`. Phase2413 does not introduce a second response authority. The route scanner performs only source-correlated selection of an already-judged method product; it does not infer response shape or rewrite the `ResponseResult`.

## Explicit remaining migration boundary

`RouteBoundaryOptions` and `RouteBindingContract` still retain the legacy `ResponseDescriptor` because boundary construction and response-schema helpers consume that contract. The route AST response binding no longer derives its meaning from that descriptor, but this does **not** yet retire `VoidResponseDescriptor.create()` from boundary setup. That retirement requires migrating the remaining boundary/schema consumers and proving their response semantics against the same closed projection ADT. Phase2413 therefore closes the lossy projection at the canonical route AST boundary, not every legacy descriptor consumer.

## Validation

- `scripts/audits/audit-phase2413-response-judgment-route-integration.cjs`: validates source-level wiring and contract assertions.
- TypeScript transpilation checks are recorded in `PHASE2413_VALIDATION.txt`.
- Full typecheck, Vitest, package build, and live scan/sync CLI are not claimed unless explicitly marked as executed in the validation record.
