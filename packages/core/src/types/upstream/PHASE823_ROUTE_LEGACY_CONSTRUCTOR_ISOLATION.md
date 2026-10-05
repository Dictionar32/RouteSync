# Phase 823 — Route Legacy Constructor Isolation

## Trace

The canonical route construction path remains:

`RouteDeclarationAst -> RouteEmission -> RouteBoundaryContractFactory -> RouteProducerInput -> routeProducer.produce() -> RouteAst`

The remaining `RouteSemanticFlowFactory` is now isolated from the former constructor helper wrappers.

## Repairs

- Inlined legacy factory orchestration into `RouteSemanticFlowFactory.ts` so the production factory no longer imports `routeSemanticFactories.ts`.
- Inlined invalidation projection and hook-source projection so production no longer imports `routeMutations.ts`.
- Deleted `routeSemanticFactories.ts`.
- Deleted `routeMutations.ts`.
- Added `audit-phase823-route-legacy-constructor-isolation.cjs`.

## Boundary

The remaining files under `descriptors/route/factories/` are retained only because SDK tests still import them directly. They are no longer part of the core production dependency graph. They are the next deletion frontier after test migration.

## Audit invariant

`coreLegacyWrapperReferences = []` and `productionRouteFactoryTreeDetached = true`.

Full TypeScript build is not claimed here because the extracted workspace does not contain local `node_modules/.bin/tsc` or `tsup`.
