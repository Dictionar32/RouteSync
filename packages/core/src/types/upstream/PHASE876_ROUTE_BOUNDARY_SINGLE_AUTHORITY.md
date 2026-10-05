# Phase 876 — Route Boundary Single Authority

## Trace finding

Phase 875 correctly wired `RouteScanner` to the canonical `routeProducer.produce()` constructor, but the canonical bundle still reconstructed the same `RouteBoundaryContract` twice per route: once for `RouteProducerInput` and once for `RouteSemanticFlow`.

## Fix

`RouteScanner.scanCanonicalBundle()` now performs exactly one upstream projection per `RouteEmission`:

```text
RouteEmission
    ↓
RouteBoundaryContractFactory.create()
    ↓
RouteBoundaryContract
    ├── RouteProducerInput
    │       ↓
    │   routeProducer.produce()
    │       ↓
    │   RouteAst
    │
    └── RouteSemanticFlow
```

The old emission wrappers were not used anywhere in production or tests and were removed from the active relation module. No legacy files were deleted.

## Validation

- `audit:phase875-route-producer-upstream-wiring` — PASS
- `audit:phase876-route-boundary-single-authority` — PASS
- `audit:phase839-route-single-scan` — PASS
- changed-file TypeScript diagnostics — no `RouteScanner.ts` or `routeProducerRelations.ts` errors
- zero-byte files under `packages` — 203

## Authority rule

Do not activate the six-stage `AstSemanticAuthorityPipeline` until a shared semantic identity/provenance chain exists across its stage producers.
