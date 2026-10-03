# Interface Trace Audit — Phase 45

## Objective

Raise remaining semantic capability surfaces from `upstream/highLevelContracts.ts` into the owning upstream ADT modules, keeping the high-level barrel as a compatibility/composition layer.

## Laravel alignment

Laravel 13 separates route parameters, dependency injection, and route model binding. The scanner therefore needs upstream semantic resolution while downstream interfaces should carry resolved facts rather than Laravel interpretation rules.

## Ownership changes

- `model.ts` owns `ModelRelationSurface`.
- `resource.ts` owns `ResourceTransformationSurface`.
- `request.ts` owns `RequestValidationSurface`.
- `response.ts` owns `ResponseOutcomeSurface`.
- `route.ts` owns `RouteSemanticSurface`.
- `controller.ts` owns `ControllerDataflowSurface` and `DependencyFlowSurface`.
- `service.ts` owns `ServiceDependencySurface`.

## Compatibility

`highLevelContracts.ts` re-exports these surfaces and continues to compose the legacy `*HighLevelContract` interfaces. No downstream consumer needs to migrate in one step.

## Rule

`highLevelContracts.ts` must not become the owner of new domain vocabulary. New semantic ADTs/capability surfaces belong beside their upstream domain type.
