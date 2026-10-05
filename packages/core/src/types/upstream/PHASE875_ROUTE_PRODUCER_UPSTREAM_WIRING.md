# Phase 875 — Route Producer Upstream Wiring

## Goal

Wire the active route scanner directly to the canonical upstream `RouteProducer` input boundary without introducing another `RouteAst` constructor.

## Cutover

The production route path is now:

```text
RouteDeclarationAst + RouteEmission
  -> routeProducerInputFromRouteBoundary(boundary, ...)
  -> RouteProducerInput
  -> routeProducer.produce()
  -> RouteAst
```

`RouteScanner` no longer calls the compatibility-shaped `routeAstFromRouteEmission()` helper.

## Authority rule

`packages/core/src/compiler/scanner/subscanners/routeProducer.ts` remains the sole `RouteAst` constructor. `routeProducerRelations.ts` now projects the canonical `RouteBoundaryContract` into `RouteProducerInput`; the emission-to-boundary step is separate and shared.

## Validation

- `audit:phase875-route-producer-upstream-wiring` — PASS
- `audit:phase839-route-single-scan` — PASS
- zero-byte files under `packages` — 203
- legacy route factory files remain present and empty; none were deleted

## Next frontier

Continue tracing actual upstream producer-to-consumer paths. Do not activate the six-stage `AstSemanticAuthorityPipeline` by aggregating unrelated producer APIs until a shared semantic identity/provenance chain is proven.
