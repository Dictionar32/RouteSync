# Phase 2174 — Interface-First DTO Project Correlation

## Trace finding

The Phase 2173 positive DTO judgment closed class-identity and inventory-completeness holes, but its `Extract<LaravelProjectDtoDeclarationInventoryInterface, ...>` used the default project type. That widened the inventory independently of the `Project` carried by the request. The authority and judgment were also non-generic, so project correlation was lost at the authority boundary.

## Contract correction

- `LaravelControllerResponseDtoDeclarationResolvedInput<Project>` now derives from `LaravelControllerResponseDtoDeclarationResolutionInput<Project>` and requires a complete `LaravelProjectDtoDeclarationInventoryInterface<Project>`.
- `LaravelControllerResponseDtoDeclarationResolutionJudgment<Project>` correlates all request variants to the same project type.
- `LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface<Project>` consumes and returns judgments parameterized by that same project identity.
- `LaravelControllerResponseDtoDeclarationResolutionRuntimeExecutorInterface<Project, Authority>` binds to the corresponding authority specialization and exposes its exact `resolve` operation.

## Architecture boundary

This strengthens the existing upstream contract; it does not add a relation/foundation layer or a subscanner. It does not create a second invocation authority. The invocation semantic judgment and `InvocationSemanticIntegratedResponseCompositionInterface` remain distinct, existing owners.

## Remaining integration work

The trace still finds `dtoInventory: readonly DtoAst[]` in the Laravel scanner input and the integrated controller response judgment input. The declaration-resolution authority has no concrete producer/wiring in `packages/core/src` yet. Therefore this phase closes project correlation in the interface but does not claim the scanner or integrated response runtime has been migrated. Build/typecheck/full tests were not run.
