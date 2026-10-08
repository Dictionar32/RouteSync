# Phase 828 — Route Boundary Consumer Cutover

## Objective

Continue the route authority cutover by removing the final SDK consumer of `RouteBoundaryAdapter` without introducing a replacement model or compatibility adapter.

## Applied wiring

`packages/sdk/tests/pureRouteDomainContracts.spec.ts` now uses the existing canonical `RouteBoundaryContractFactory` directly for its boundary-construction case.

The test no longer constructs boundary subcontracts through `RouteBoundaryAdapter` and no longer routes that case through `RouteSemanticFlowFactory`.

Canonical test path:

```text
RouteBoundaryOptions
  -> RouteBoundaryContractFactory.create()
  -> RouteBoundaryContract
```

## Audit result

- `RouteBoundaryAdapter` SDK/production consumers: `0`
- remaining SDK test files importing/using `RouteSemanticFlowFactory`: `31`
- preserved legacy route factory files: present and empty
- preserved `routeMutations.ts`: present and empty
- canonical `RouteBoundaryContractFactory`: present

## Interpretation

The remaining 31 `RouteSemanticFlowFactory` references must not be mass-replaced. They need classification by the semantic authority they actually test:

1. boundary-contract tests -> `RouteBoundaryContractFactory`
2. scanner/integration tests -> `RouteEmission -> RouteBoundaryContractFactory -> RouteProducerInput -> routeProducer -> RouteAst`
3. downstream semantic tests -> existing `RouteAst` / closed semantic contracts
4. factory-specific legacy tests -> retire or empty only after their behavior is covered by the canonical authority

No new route model, compatibility adapter, or second constructor is required.

## Next frontier

Trace and cut over the 31 remaining SDK consumers one semantic family at a time. Keep legacy files in place and empty until reachability is proven zero.
