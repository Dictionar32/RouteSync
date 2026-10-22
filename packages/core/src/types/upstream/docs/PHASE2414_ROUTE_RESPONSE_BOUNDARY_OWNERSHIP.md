# Phase2414 — Route Response Boundary Ownership

## Scope

Continue the Integrated Response handoff from Phase2413. The change moves ownership of the method-correlated response projection from a side-channel argument on `RouteProducerInputCompositionInput` into the existing canonical `RouteBoundaryContract` → `RouteBindingContract` chain.

## Root cause addressed

Phase2413 passed `responseProjection` separately from the route boundary. The projection was selected from the original declaration evidence, while resource routes expand into multiple action-specific route targets. That made the projection input capable of disagreeing with the actual emitted action and left two competing values at the operation boundary.

## Production changes

1. `RouteBoundaryOptions` and `ResolvedRouteBoundaryOptions` now require the existing `EndpointResponseBinding` ADT as `responseProjection`.
2. `resolveRouteBoundaryInput` and `buildRouteBindingContract` preserve that exact projection through the resolved boundary and canonical `RouteBindingContract`.
3. The route scanner computes action correlation once for each emitted route target. The same `ControllerActionJudgmentRouteSelection` feeds request binding and response-product selection; no second authority judgment is performed.
4. Response selection happens after resource action expansion and uses the actual emitted controller/action target. The existing source-span correlation remains required when selecting the method-owned response product.
5. `RouteProducerInputCompositionInput` no longer accepts a second response projection. The existing composition operation reads `boundary.binding.responseProjection`, and the existing `RouteProducer` remains the only constructor of `RouteAst`.
6. Unmatched, ambiguous, invalid-provenance, unavailable, non-projectable, and closure response outcomes remain explicit blocked ADT variants.

## Authority ownership

- Invocation and Integrated Response meaning remain owned by the existing controller response semantic pipeline.
- Controller/action selection remains owned by the existing `controllerActionRouteCorrelationAuthority`.
- The route boundary carries the selected, closed response outcome; it does not reinterpret `ResponseResult`.
- The producer only copies the closed response binding into the canonical route AST.

## Remaining migration

`RouteBoundaryOptions.response` and `RouteBindingContract.response` still retain the legacy `ResponseDescriptor`, and `laravelRouteScanner.ts` still seeds it with `VoidResponseDescriptor.create()` for compatibility consumers. The canonical route AST response binding no longer derives its meaning from that descriptor, but the legacy schema/analysis consumers have not yet been migrated. Phase2414 therefore closes the duplicate response-projection handoff and fixes per-emitted-target correlation; it does **not** claim full retirement of the compatibility descriptor or complete CLI closure.

## Validation

- Phase2414 boundary ownership audit: 12/12 assertions passed.
- Phase2394 route producer operation contract audit: 10/10 assertions passed.
- Phase2393 route producer evidence closure audit: 8/8 assertions passed.
- TypeScript syntax transpilation: 7/7 modified production files passed.
- Targeted TypeScript semantic compilation was compared against Phase2413: no new diagnostic signatures; one pre-existing missing-name diagnostic disappeared. The command still fails on existing repository dependency-graph diagnostics.
- Full TypeScript typecheck: blocked by baseline configuration/parser and existing dependency-graph diagnostics; no full pass claimed.
- Vitest, package build, and live scan/sync CLI: not run.
