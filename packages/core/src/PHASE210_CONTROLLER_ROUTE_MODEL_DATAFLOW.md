# Phase 210 — Controller Parameter → Route Parameter → Model Knowledge Data-Flow

## Source-of-truth rule

A controller/action parameter, route parameter and resolved model binding are semantic knowledge. They must exist as typed facts before lookup indexes or control-flow dispatch are used.

```text
ControllerActionParameter
        │
        └── declares ──► ClassName
                            │
                            ├── resolves_to ──► ModelName
                            └── resolves_to ──► EnumName

RouteParameter
        │
        └── binds_to ──► ControllerActionParameter
                              │
                              └── binding_target ──► Model / Enum / Parameter
```

## Phase 210 elevation

`resolveRouteBindingKnowledgeDataFlow()` now materializes `RouteBindingResolutionFact[]` containing:

- the original route binding fact;
- the controller/action parameter type;
- resolved model and enum identities;
- resolved binding target kind;
- binding scoping knowledge;
- `withTrashed` knowledge.

`resolveRouteBindingSemantics()` is now only a projection from those facts to the legacy contract.

## Catalog boundary

`routeBindingKnowledgeCatalog.ts` contains the semantic rule tables. `Map` remains a lookup representation of those catalogs. It is not the semantic source of truth.

## Control-flow boundary

Semantic target/scoping/withTrashed decisions are represented by catalog keys and facts. Remaining `switch`/conditional dispatch operates on already-typed semantic kinds and therefore acts as an interpreter, not as the origin of Laravel knowledge.

## Middleware elevation

Authorization middleware detection is now represented by `RouteAuthorizationKnowledge`. Raw `startsWith('auth')` convention is isolated inside the semantic knowledge catalog instead of being repeated by route consumers.
