# Phase Error Repair 12 — Route Entity Boundary

## Trace
`routeEntityDefinition.ts` masih memakai branded `string` RouteName/RoutePath, `Record<string, unknown>`, `Record<string,string>`, fallback `??`, dan `EMPTY_FIELD_NODE` tanpa origin.

## Root cause
Route entity merupakan kontrak legacy yang belum dinaikkan ke semantic ADT. Response sebenarnya sudah required, sehingga fallback `EMPTY_FIELD_NODE` membuang provenance/meaning.

## Repair
- RouteName/RoutePath menggunakan `domain/semanticValues` sebagai vocabulary canonical pada boundary ini.
- `createRouteName()` dan `createRoutePath()` menghasilkan semantic values.
- `RouteMiddlewareName` menjadi ADT.
- `RouteSchemaEntry` menjadi ADT.
- `RouteAssignmentEntry` menjadi ADT.
- `StableRouteHash` menjadi value object.
- `RawRouteDefInput.schema` dan `assignments` tidak lagi generic `Record`.
- `RouteDefDescriptor.fromRouteDef()` tidak lagi memakai `??` atau `EMPTY_FIELD_NODE`.
- response wajib dibawa dari origin.
- barrel exports diselaraskan.

## Verification
Targeted narrow TypeScript compile: Root 12 diagnostics hilang. Remaining diagnostics belong to other roots:
- `Hash.ts` crypto type environment
- `phpAst/kinds.ts` exhaustive matcher
- `routeHandlers.ts` FormRequestDescriptor boundary
- `semantic/index.ts` TraceNode export
- `semanticTypes.ts` PropertyName/string boundary

## Dataflow
`route scanner raw boundary → RouteName/RoutePath/route payload ADT → RouteDefDescriptor → downstream`

Tidak menambahkan field legacy dan tidak membuat fallback kosong.
