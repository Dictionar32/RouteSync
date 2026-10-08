# Phase 826 — Route Wiring Trace and Preservation Boundary

## Trace conclusion

The route production graph is already wired to the canonical upstream authorities. The correct repair is dependency-path correction, not another route model or compatibility adapter.

Canonical path:

`RouteDeclarationAst -> RouteEmission -> RouteBoundaryContractFactory.create() -> RouteBoundaryContract -> RouteProducerInput -> routeProducer.produce() -> RouteAst`

`routeProducerRelations.ts` constructs `RouteProducerInput` and calls the sole canonical `routeProducer.produce()` constructor. No other core file constructs the `route_ast` judgment.

## Preservation rule

The former route factory paths remain in the tree but are intentionally empty during migration. They are not production implementations and must not be deleted until reachability has been proven zero.

Preserved empty files:

- `compiler/scanner/descriptors/route/factories/syntheticRouteFactory.ts`
- `compiler/scanner/descriptors/route/factories/index.ts`
- `compiler/scanner/descriptors/route/factories/contractRouteFactories.ts`
- `compiler/scanner/descriptors/route/factories/closureRouteFactory.ts`
- `compiler/scanner/descriptors/route/factories/controllerActionRouteFactory.ts`
- `compiler/scanner/descriptors/route/factories/closureSyntheticFactories.ts`
- `compiler/scanner/descriptors/route/factories/controllerReferenceRouteFactory.ts`
- `compiler/scanner/descriptors/route/factories/actionRouteFactories.ts`
- `compiler/scanner/descriptors/route/routeMutations.ts`

The Phase 826 audit requires all of these paths to exist and remain zero bytes.

## Dependency result

- Production references to the preserved legacy route factory directory: `0`.
- Production references to `routeSemanticFactories.ts` / `routeMutations.ts`: `0`.
- SDK tests still naming `RouteSemanticFlowFactory`: `33` at this checkpoint.
- These SDK references are the next wiring frontier; they are not evidence that a replacement production factory is missing.

## Repair direction

Migrate the SDK tests according to what each test is actually proving:

1. Boundary tests -> `RouteBoundaryContractFactory.create()` and nested `RouteBoundaryContract` subcontracts.
2. Canonical route pipeline tests -> `RouteEmission` -> existing `routeAstFromRouteEmission()` -> `RouteAst`.
3. Tests that genuinely target legacy compatibility behavior -> keep isolated until their consumer is proven unnecessary; do not recreate the deleted factory tree.

Do not restore flat legacy fields to the canonical contracts merely to satisfy old tests. Wire each consumer to the existing authority that already owns the requested semantic fact.

## Stale-document correction

Phase 824 described the legacy factory directory as deleted. That is no longer the filesystem state. Phase 825 deliberately restored those paths as empty files, so Phase 824 documentation must be read as historical and Phase 826 is the authoritative preservation/wiring trace.
