# PHASE_ERROR_REPAIR_08_CONTRACTS

## Root
`packages/core/src/types/domain/contracts.ts` was mixing the old flat `ParsedRoute` model with the new nested route ADT and old response fields.

## Trace

```text
ParsedRoute
  -> identity
  -> binding
  -> capability
  -> provenance
  -> contract
```

The contract builder was still reading legacy flat properties such as `route.method`, `route.response`, `route.schema`, `route.pathParameters`, `route.executionSignature`, `route.errorResponses`, and response fields `readTypeName`, `validatorName`, `mapperName`.

There was also a vocabulary split between `domain/semanticValues` and `ir/nominalVocabulary`.

## Repair

- `ScannedEndpointContract.fromRoute()` now consumes the four canonical `ParsedRoute` subcontracts.
- `fromSubcontracts()` now consumes `identity`, `binding`, `capability`, and `provenance` directly.
- Removed legacy `readTypeName`, `validatorName`, `mapperName`, and `shape` fields from `EndpointSuccessResponseContract` construction.
- `EndpointErrorResponseContract` now carries `HttpErrorName`, `ResponseTypeName`, and `HttpErrorSchema` rather than free schema/name values.
- `EndpointContract` uses canonical domain semantic names for endpoint identity/path/domain/resource.
- Added missing semantic name ADTs required by the route boundary: `ActionName`, `ControllerName`, `RoutePath`, `SourceLineNumber`, `HttpErrorName`.
- `HttpErrorResponseDescriptor` now uses `HttpErrorName` and `ResponseTypeName`.
- Route classification now reads `ParsedRoute.capability.crudRole` / `capability.hookKind` instead of removed flat properties.
- Manifest contract map is keyed by canonical `RouteName`.

## Verification

Targeted compile of the contract boundary:

```text
contracts.ts
httpErrors.ts
routes.ts
semanticValues.ts
```

produced no diagnostics from those files.

Broader compile of `domain/index.ts` also produced no diagnostics from the repaired root. Remaining diagnostics belong to separate roots, including `ResourceFieldDescriptor.semanticType`, `TypeExpression` export drift, `routeEntityDescriptor`, `routeHandlers`, PHP AST matcher, and semantic type consumers.

## Status

Root 08 contract/export boundary: CLOSED.

Next root should be selected from the remaining diagnostics rather than adding legacy fields back into `ParsedRoute`.
