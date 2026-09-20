# Phase 137 — Interface High Model Repair

## Scope
Interface/ADT upstream only. Consumer flow is intentionally not repaired yet.

## Repairs
- Renamed upstream `RequestIdentity` to `RequestSourceIdentity` to remove a second canonical `RequestIdentity` vocabulary.
- Canonical domain `RequestIdentity` remains the route-bound identity.
- `FormTypeName` now reuses the upstream semantic name vocabulary instead of defining a second domain wrapper.
- `RequestType` now has one request source path: `identity + source + actions + response`; duplicate `origin + schema` projections were removed.
- `ResourceGroupIdentity` now carries semantic `ResourceName` / `PropertyName` values.
- `ResourceGroupPrimaryKey` now carries semantic `PropertyName` for its name.
- `ResourceGroupQueryKeys` is a semantic domain surface; old `listKeyFn/detailKeyFn` are construction-only adapter inputs.
- Canonical `ResourceGroupDescriptor` no longer extends a lowering trait.
- Lowering capability was renamed `ResourceGroupLoweringOperations` and is no longer part of the canonical BaseResourceGroupDescriptor contract.
- Resource group classes now expose canonical `identity`, `primaryKey`, `queryKeys`, and `routes` while legacy construction state is protected/internal to the implementation.

## Verification
Targeted TypeScript verification of the changed interface files reports no internal ResourceGroup model errors.
Remaining errors are expected legacy consumers of the newly elevated RouteIdentity contract:
- `contracts.ts`: `identity.name`, `identity.method`
- `operationGraph.ts`: `identity.name`, `identity.resourceName`

These are deliberately not repaired in this phase. They are the next trace targets after the upstream interface graph is further stabilized.

Environment limitation: the workspace has no installed Node type definitions, so `crypto` also appears as a verification error.
