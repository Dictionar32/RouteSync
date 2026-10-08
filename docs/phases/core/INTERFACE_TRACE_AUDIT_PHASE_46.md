# Interface Trace Audit — Phase 46

## Laravel reference path

Laravel's routing pipeline distinguishes controller dependencies, HTTP request injection, route parameters, and route model binding. Controller dependencies are resolved through the service container; request objects can be injected into controller methods; route parameters remain route facts; implicit model binding is a separate semantic resolution step. These facts support the repository direction:

```text
Laravel source AST
  -> canonical upstream ADT / vocabulary
  -> semantic correlation + Laravel-specific resolution
  -> passive capability / resolved-fact surfaces
  -> dumb flow interfaces
  -> downstream graph / consumers
```

## Phase 46 ownership changes

Canonical high-level composition contracts now live with their domain ADTs:

- `model.ts`: `ModelHighLevelContract`, `RelationHighLevelContract`
- `resource.ts`: `ResourceHighLevelContract`, `ResourceFieldSemanticContract`
- `request.ts`: `RequestHighLevelContract`
- `response.ts`: `ResponseHighLevelContract`
- `route.ts`: `RouteHighLevelContract`
- `controller.ts`: `ControllerActionHighLevelContract`, controller high-level union, and composite controller flow contract
- `service.ts`: `ServiceHighLevelContract`, `ServiceSemanticContract`
- `highLevelSourceModel.ts`: `LaravelSemanticContractCatalog`, `LaravelSemanticLookup`

`highLevelContracts.ts` is now a compatibility/composition barrel. It re-exports canonical types and retains only the cross-domain aggregate `LaravelDomainContract` plus compatibility response aliases.

## Flow rule

No downstream flow contract gained semantic interpretation in this phase. Route/controller/request flow types continue to carry references, parameter names, and resolved facts. Laravel interpretation remains upstream in AST/ADT correlation.

## Service correction

`ServiceSemanticContract` was previously referenced but not defined. It is now canonically owned by `service.ts` and adds only the resolved dependency projection to `ServiceHighLevelContract`.

## Tombstone policy

No source file was physically deleted. Legacy `highLevelContracts.ts` remains as a compatibility surface so dropping the Phase 46 tree into an existing project does not rely on filesystem deletion semantics.
