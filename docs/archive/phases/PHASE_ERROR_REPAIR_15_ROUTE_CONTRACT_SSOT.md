# Phase Error Repair 15 — Route Contract SSOT

## Trace

`packages/core/src/types/domain/routeEntityDefinition.ts` and `packages/core/src/types/domain/routes.ts` both declared `RouteIdentityContract` and `RouteProvenanceContract`, but they represented different semantic layers.

- `routes.ts` owns the canonical `ParsedRoute` identity/binding/capability/provenance contract consumed by route scanning and endpoint contracts.
- `routeEntityDefinition.ts` owns the older `RouteDefContract` entity representation with its own identity/security/payload/provenance shape.

The duplicate names made two different contracts look like one semantic type and caused the domain barrel to export the wrong identity.

## Repair

The canonical names remain:

- `RouteIdentityContract` in `domain/routes.ts`
- `RouteProvenanceContract` in `domain/routes.ts`

The older entity-layer contracts were renamed explicitly:

- `RouteEntityIdentityContract`
- `RouteEntityProvenanceContract`

All entity-definition barrels/tests/imports were updated to use the explicit entity names. The canonical route identity/provenance exports were restored from `domain/routes.ts` through the domain barrel.

No fields were added to upstream merely to satisfy the duplicate contract. `upstream/route.ts` remains the source AST/domain vocabulary for basic route semantics; the richer `ParsedRoute` contract remains the composed route-domain model.

## Verification

Targeted TypeScript compilation no longer reports:

- missing `RouteIdentityContract` from `./domain`
- missing `RouteProvenanceContract` from `./domain`
- duplicate route identity declaration as the current failure

Remaining diagnostics are independent roots:

1. `semanticTypes.ts`: `PropertyName` is still passed where a primitive `string` is expected.
2. `types/semantic/index.ts`: `TraceNode` export is missing.
3. `compiler/utils/Hash.ts`: `crypto` type declaration is unavailable in the narrow compile environment.

These are intentionally not patched in this root.
