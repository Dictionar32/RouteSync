# Phase Error Repair 21 — Request Runtime High Model

## Root
`packages/core/src/types/domain/requestModels.ts`

## Trace
Previous request models mixed declaration and runtime values:
- `string | number | boolean`
- `unknown`
- `Record<string, ...>` as canonical semantic data
- lookup methods returning `undefined`
- route parameter descriptors duplicating the upstream route parameter model

## Repair
Canonical runtime request data is now represented by `RequestRuntimeValue`:
- string
- number
- boolean
- null_value
- list
- object

Route parameter runtime entries now carry:
- `RouteParameterName`
- `PropertyName`
- upstream `RouteParameterLocation`
- `RequestRuntimeValue`

Query entries now carry `PropertyName` and `RequestRuntimeValue`.
Payload properties now carry `PropertyName` and `RequestRuntimeValue`.

Lookup APIs use explicit ADTs:
- `RouteParameterLookup`
- `RouteQueryLookup`
- `PayloadPropertyLookup`

`RouteParameterKind` is derived from `RequestRuntimeValue` scalar kinds and is not an independent semantic vocabulary.

## Verification
Targeted narrow compile:
- `requestModels.ts` errors: 0
- domain barrel export errors: 0
- remaining diagnostic: `compiler/utils/Hash.ts` cannot resolve Node `crypto` typings in the current environment.

## Boundary principle
Runtime request values remain distinct from route parameter declarations. No fake fallback or second route-parameter semantic model was introduced.
