# Phase 877 — Route Downstream Authority Cutover

## Trace

The Phase 876 route boundary is now the single semantic authority:

```text
RouteEmission
  -> RouteBoundaryContractFactory.create()
  -> RouteBoundaryContract
       -> RouteProducerInput -> routeProducer.produce() -> RouteAst
       -> RouteSemanticFlow -> RouteManifest
```

The downstream trace found `NextActionGenerator` still reading the `RouteSemanticFlow` as if it exposed legacy flat route fields on `raw` (`pathParameters`, `queryParameters`, `requestContentType`, `executionSignature`, `auth`, `isMutating`, `schema`). Those reads bypassed the closed semantic subcontracts.

## Fix

`NextActionGenerator` now reads:

- `route.raw.identity.parameters.path`
- `route.raw.identity.parameters.query`
- `route.raw.capability.requestContentType`
- `route.raw.capability.executionSignature`
- `route.raw.capability.auth`

Payload mode is no longer reconstructed from fallback heuristics; it is taken directly from the upstream execution-signature authority.

The generator remains a projection/consumer. No new route model or symbol authority was introduced.

## Validation

- `audit:phase877-route-downstream-authority`: PASS
- `audit:phase876-route-boundary-single-authority`: PASS
- `audit:phase875-route-producer-upstream-wiring`: PASS
- no files deleted
- legacy zero-byte file count retained

The remaining CLI flat fields on `ClassifiedRoute` are intentional projection fields; they are not treated as a second semantic authority. The next downstream frontier should only cut those fields where a consumer still reaches back through `raw` instead of using the canonical nested contracts.
