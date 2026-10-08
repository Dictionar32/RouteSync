# Phase 819 — Route Boundary Authority

Phase 819 removes the remaining boundary-authority inversion introduced by Phase 818.

## Changes

- `RouteBoundaryContract` is now defined in `types/upstream/route.ts` as canonical semantic vocabulary.
- `boundaryBasicsTypes.ts` no longer imports `RouteSemanticFlowCompleteContracts` from the legacy descriptor tree.
- `RouteSemanticFlowCompleteContracts` is retained only as a compatibility alias to the canonical upstream `RouteBoundaryContract`.
- `contractRouteFactories.ts` now calls `RouteBoundaryContractFactory.create()` directly instead of `RouteBoundaryAdapter`.
- `RouteBoundaryAdapter.ts` was removed.
- The root core export no longer exposes `RouteBoundaryAdapter`.
- `routeProducerRelations.ts` remains free of both `RouteSemanticFlowFactory` and `RouteSemanticFlow`.

## Resulting authority

```text
RouteEmission
  -> RouteBoundaryContractFactory
  -> RouteProducerInput
  -> routeProducer.produce()
  -> RouteAst
```

The legacy descriptor vocabulary no longer owns the boundary contract type.

## Audit

The Phase 819 audit reports:

- routeProducerRelationsUsesLegacyFactory: false
- routeProducerRelationsUsesLegacyFlow: false
- boundaryBasicsDependsOnDescriptorContracts: false
- canonicalBoundaryContractDefinedUpstream: true
- legacyRouteContractsAliasesCanonicalBoundary: true
- descriptorSparseFactoryUsesCanonicalBoundaryFactory: true
- legacyBoundaryAdapterExists: false
- rootExportsLegacyBoundaryAdapter: false

## Next frontier

Do not delete all `RouteSemanticFlow` references yet. The remaining references must be classified into semantic consumers versus descriptor-only exports/factories. Remove descriptor-only reachability first, then migrate genuine semantic consumers to the canonical upstream route vocabulary.

A full TypeScript/DTS build is not claimed here because the extracted workspace does not contain local `tsc`/`tsup` binaries.
