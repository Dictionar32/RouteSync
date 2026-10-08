# Phase 822 — Route Public Factory Isolation

## Objective

Remove `RouteSemanticFlowFactory` from the public core/compiler/descriptors export surface without creating a second construction authority.

## Changes

- Removed `RouteSemanticFlowFactory` from:
  - `packages/core/src/index.ts`
  - `packages/core/src/compiler/index.ts`
  - `packages/core/src/compiler/scanner/scannerExports.ts`
  - `packages/core/src/compiler/scanner/descriptors/index.ts`
  - `packages/core/src/compiler/scanner/descriptors/routeDescriptors.ts`
  - `packages/core/src/compiler/scanner/descriptors/route/index.ts`
- SDK tests that still exercise the legacy descriptor behavior now import the factory directly from its legacy implementation file instead of through the public barrel.
- No compatibility adapter or replacement factory was introduced.

## Semantic boundary

The active route construction authority remains:

`RouteDeclarationAst -> RouteEmission -> RouteBoundaryContractFactory -> RouteProducerInput -> routeProducer.produce() -> RouteAst`

The legacy route factory is now an isolated internal island used only by legacy tests and its own descriptor implementation tree.

## Next frontier

Migrate legacy SDK factory fixtures/test scenarios to canonical semantic contracts and/or RouteAst projections. Once the SDK reference count reaches zero, delete the legacy route factory island and then continue decomposing `RouteSemanticFlow` and `RouteDescriptor`.
