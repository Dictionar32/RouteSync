# Phase 820 — Route Semantic Flow Consumer Cutover

## Objective

Remove the remaining construction-time dependency on `RouteSemanticFlowFactory` from active semantic consumers without introducing another compatibility factory.

## Changes

- `InvalidationResolver` no longer type-tests for `RouteSemanticFlowFactory` or calls `withInvalidation`.
- Invalidation now updates the canonical `RouteSemanticFlow` capability and rebuilds its `ScannedEndpointContract` directly.
- `typeDeriverUtils.resolveRouteDomain` now treats `RouteDomainInput.domain` as the canonical pre-resolved domain and no longer delegates to `RouteSemanticFlowFactory.resolveDomain`.
- `routePathParser` now imports `RouteParameterSemanticFactory` from its canonical semantic route module.
- `boundaryBasics` now imports `RouteParameterSemanticFactory` from its canonical semantic route module.

## Audit

Phase 820 audit confirms:

- `routeProducerRelations` has zero `RouteSemanticFlowFactory` references.
- `routeProducerRelations` has zero `RouteSemanticFlow` references.
- `InvalidationResolver` has zero `RouteSemanticFlowFactory` references.
- `typeDeriverUtils` has zero `RouteSemanticFlowFactory` references.
- route parameter parser/boundary paths have zero descriptor-layer parameter-factory imports.
- Remaining `RouteSemanticFlowFactory` references are confined to the legacy descriptor/factory/export tree (14 files), rather than active route semantic consumers.

## Next frontier

Do not delete the remaining factory tree blindly. First remove or isolate its public exports and audit each remaining descriptor factory for reachability. The next cutover should target the legacy descriptor construction/export tree itself.

## Build status

A full DTS build is not claimed from this extracted checkpoint because the workspace does not provide local `tsc`/`tsup` binaries. The Phase 820 structural audit is the authoritative validation available in this workspace.
