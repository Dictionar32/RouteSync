# Phase 31 — Controller Constructor Dependency Elevation

## Laravel semantic basis

Laravel 13 resolves controllers through the service container. Controller dependencies may be injected through the constructor, while method injection supplies dependencies to individual controller methods. Eloquent route-model binding is a separate route/action concern.

## Upstream path

PHP controller AST
→ `ControllerDeclarationAst.methods` (constructor remains syntax AST)
→ `ControllerScanner` identifies `__construct` and excludes it from action production
→ `resolveControllerActionContract()` receives constructor parameters as semantic input
→ `resolveConstructorDependencies()` lowers named constructor types into `ControllerDependency` with `injection.kind = 'constructor'`
→ method dependencies are lowered separately with `injection.kind = 'method'`
→ `ControllerActionContract.dependencies`
→ `ControllerAction.dependencies: Sequence<ControllerDependency>`
→ `ControllerActionFlowContract`
→ `ControllerSemanticNode.action`
→ `LaravelSemanticContractCatalog.controllers`
→ downstream consumers.

## Invariants

- Constructor is never emitted as a controller action.
- Constructor dependency semantics are produced upstream once.
- `ControllerDependency` remains an interface; injection mode remains an ADT.
- Method model binding and request binding remain distinct from service-container dependencies.
- Downstream code does not inspect parameter position or raw AST to discover dependencies.
