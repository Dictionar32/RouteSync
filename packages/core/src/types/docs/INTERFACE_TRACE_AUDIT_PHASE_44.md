# Interface Trace Audit — Phase 44

## Goal

Raise controller-flow vocabulary one level upstream so that flow interfaces remain passive transport contracts.

## Laravel source-of-truth checked

Laravel 13 documents that:

- controller/route callback dependencies are resolved by the service container;
- `Illuminate\\Http\\Request` is method-injected;
- route parameters are supplied separately from dependencies;
- implicit route model binding resolves a type-hinted model whose variable name matches a route segment.

Therefore the analyzer should resolve these relations upstream and emit only resolved evidence downstream.

## Ownership after Phase 44

- `controller.ts`
  - `ControllerRouteFlowSurface`
  - `ControllerRouteParameterBindingSurface`
  - `ControllerRequestFlowSurface`
  - dumb binding contracts
- `request.ts`
  - `ControllerRequestBindingKind`
- `route.ts`
  - `ControllerRouteParameterBindingKind`
- `highLevelSourceModel.ts`
  - correlation / Laravel-specific resolution
- `highLevelContracts.ts`
  - compatibility re-exports only for these flow contracts

## Forbidden regression

Do not put Laravel matching, controller parameter scanning, model-binding resolution, or rich source contracts back into the flow interfaces.

## Validation

A TypeScript graph check was executed. The repository still has pre-existing unrelated errors in scanner AST construction, `EloquentRelationDescriptor`, `ServiceSemanticContract`, and duplicate barrel exports. No new Phase 44 ownership error was observed in the reported diagnostics.
