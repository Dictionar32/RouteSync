# Phase Error Repair 19 — Route Parameter High Model

## Flow

```text
Laravel route source
  ↓
RouteScanner
  ↓
ScannedRouteParameterDescriptor
  ↓
RouteParameter ADT (upstream SSOT)
  ↓
RouteDefinition / RouteManifest
  ↓
downstream consumers
```

## Root found

The previous canonical route parameter interface in `types/domain/parameters.ts` was a low-level duplicate:

- `name: string`
- `propertyName: string`
- `bindingField: string | null`
- `required: boolean`
- `in: RouteParameterLocation`
- `type: RouteParameterType`

The upstream route model only carried `name`, `constraint`, and therefore could not carry the complete semantic meaning required downstream.

## Repair

`types/upstream/route.ts` is now the canonical route-parameter origin.

```text
RouteParameter
├── kind: route_parameter
├── name: RouteParameterName
├── propertyName: PropertyName
├── location: path | query | header
├── binding: convention | explicit(PropertyName)
├── presence: required | optional
├── type: string | number | boolean | uuid | ulid | date | slug
└── constraint: unconstrained | pattern(StringValue)
```

`RouteParameterName` was added to `types/upstream/names.ts` so route parameter identity is not confused with a generic property name.

`types/domain/parameters.ts` now consumes/re-exports the upstream `RouteParameter` instead of defining a second semantic model. Its registries remain as domain interpretation metadata for the canonical type vocabulary.

`ScannedRouteParameterDescriptor` now converts raw scanner strings into the upstream ADTs at the scanner boundary:

- route parameter name → `RouteParameterName`
- property name → `PropertyName`
- binding field → `RouteParameterBinding`
- required → `Presence`
- raw constraint → `RouteParameterConstraint`

## Verification

Targeted compile:

```text
parameters.ts + upstream/route.ts       PASS
routeParameterDescriptorClass.ts        PASS
phase87.33.narrow                        PASS except existing Hash.ts crypto typing
```

The remaining diagnostic is:

```text
packages/core/src/compiler/utils/Hash.ts
Cannot find module 'crypto' or its corresponding type declarations.
```

This is an environment/Node type declaration issue and is not caused by the RouteParameter interface repair.

## Important distinction

`domain/requestModels.ts::RouteParameterDescriptor` was traced and is a different semantic model: it represents runtime/request parameter values (`value: string | number | boolean`), not route declaration metadata. It must not be blindly merged with the canonical upstream `RouteParameter`.

## Next root

Continue tracing remaining consumers that still assume route parameter identity is a primitive, especially controller dataflow code comparing `parameter.name` directly with raw strings. Do not add primitive aliases back to the canonical interface.
