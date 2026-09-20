# Phase 136 — Interface High-Model Repair

## Goal

Improve upstream interfaces as semantic models before changing downstream flow.
Compiler errors are intentionally retained as migration signals.

## Repairs

### 1. ScannedRouteParams

`ScannedRouteParams` no longer duplicates the complete route contract with a second flat vocabulary.

Canonical shape:

```ts
ScannedRouteCompleteContracts
├── identity
├── binding
├── capability
├── provenance
└── contract
```

### 2. RouteDescriptor

Removed duplicated `method` projections from descriptor variants.
The method is canonical at `ParsedRoute.identity.method`.

### 3. ResourceRouteGroup

`ResourceRouteGroup` is now modeled as the existing classified `ResourceGroupDescriptor<ParsedRoute>` ADT instead of `resourceName + routes[]`.
Classification is therefore part of the domain model rather than reconstructed from route arrays.

### 4. Controller request vocabulary

Controller-level request facts are no longer typed as route-level `RouteRequestBinding`.
A controller request has its own origin-level vocabulary:

```text
ControllerRequestBinding
├── no_request
├── form_request(source)
└── typed(type)
```

Route identity is resolved later at the route boundary where resource identity actually exists.

### 5. Request artifact exports

`FormRequestSource` and `FormRequestIdentity` are exported from the request artifact barrel so the canonical request model is available to scanner descriptors without introducing a second definition.

## Intentional compiler signals

The following errors are expected and useful at this phase:

- consumers still reading `RequestType.resourceName` / `formTypeName`
- resource-group consumers still reading `resourceName` directly
- route boundary producers still constructing the old request shape
- resource group descriptor factory still implementing the old low-level group interface

These are **not** fixed in this phase because doing so would mix interface design with flow migration.

## Invariant

```text
source → AST → ADT → high-level interface → manifest → downstream
```

No fallback or compatibility field is added merely to silence compiler errors.
