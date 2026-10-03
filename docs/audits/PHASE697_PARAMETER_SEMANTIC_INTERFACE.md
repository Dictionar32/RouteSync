# Phase 697 — Route Parameter Semantic Interface / Diagnostic Frontier

## Build diagnostic

The external `npm run build` reached declaration generation successfully for core/sdk/react/cli ESM/CJS bundles and failed only on `RouteParameterTypeRegistry` completeness:

- `packages/core/src/types/domain/parameters.ts(39,14)`
- missing registry entries: `integer`, `model`

The upstream route ADT already defines both variants. The domain registry had drifted behind the upstream ADT.

## Semantic correction

`RouteParameterType` and `ROUTE_PARAMETER_TYPE_REGISTRY` are now closed over every upstream route parameter type:

- `string`
- `integer`
- `number`
- `boolean`
- `uuid`
- `ulid`
- `date`
- `slug`
- `model`

`integer` and `model` are represented as semantic registry entries rather than compatibility aliases.

## Legacy descriptor cutover

The active scanner boundary was raised from the `ScannedRouteParameterDescriptor` naming/model to `RouteParameterSemanticFactory`, which directly constructs the upstream `RouteParameter` semantic ADT.

Production/public references to:

- `ScannedRouteParameterDescriptor`
- `ScannedRouteQueryParameterDescriptor`
- `routeParameterDescriptorClass`
- `routeQueryParameterDescriptorClass`

were removed. The old descriptor implementation files were emptied after reference audit.

## Validation

Targeted TypeScript transpilation: PASS, 14 files, 0 diagnostics.

Phase 525 inactive-file vacuum: PASS.

Phase 695 semantic compiler frontier remains the authoritative AST audit. Current host implementation frontier is not claimed as zero; remaining constructs are concentrated in generators/domain layers. Source-language `null`/parameter vocabulary is not treated as host-language leakage automatically.

## Architectural direction

RouteSync remains organized as:

`Laravel source evidence -> upstream semantic AST/ADT -> relational facts -> resolver graph -> fixed-point/rewrite closure -> diagnostic gate -> semantic type lowering -> Next.js target projection`

The parameter registry is therefore a closed semantic interface, not a parser compatibility table.
