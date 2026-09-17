# Phase 97 — ecommerce_shop Response Binding Upstream Repair

## Objective

Continue the interface-first trace after Phase 96. The rule is that response identity, shape, and pagination must be discovered once at the scanner/manifest boundary and carried as a closed semantic value downstream.

## Trace

```text
Laravel PHP / AST
  ↓
response attribute / controller return analysis
  ↓
ResponseContract / ResponseDescriptor
  ↓
manifest route.response
  ↓
Endpoint IR
  ↓
contract / SDK lowerers
```

For the `ecommerce_shop` register flow, `POST /register` is explicitly associated with `RegisterResponse`. The runtime payload value `data: null` is not used to infer response identity.

## Findings

1. `ScannedPaginatedEnvelopeDescriptor` stored semantic keys as raw `string` fields even though the domain already defined `ResponseDataKey`, `ResponseMetaKey`, `ResponseLinksKey`, and `EnvelopeTypeName`.
2. Cursor pagination used `null` for the absence of links. This created a second absence channel beside the ADT.
3. Pagination visitors used `as any` to recover discriminator correlation.
4. The legacy endpoint IR could reconstruct a response from `controller + action + Resource` naming and a collection heuristic (`index` / `search`). That is downstream re-classification.
5. The endpoint IR allowed a `paginated` response to carry `PaginationState`, which meant an invalid `paginated + none` combination was representable.
6. Response DTO scanning compressed named DTO types into `PrimitiveKind.UNKNOWN`, losing the declared response type before downstream lowering.
7. Response descriptor emission still read the removed `ResourceFieldDescriptor.nullable` channel.

## Repairs

### Pagination vocabulary

`ResponseDataKey`, `ResponseMetaKey`, `ResponseLinksKey`, and `EnvelopeTypeName` are now the values carried by scanned pagination descriptors.

Links absence is represented exclusively by:

```text
no_links_key
```

and presence by:

```text
links_key → ResponseLinksKey
```

No `null` is stored in the pagination descriptor.

### Exhaustive pagination dispatch

`matchResponseShape`, `matchPaginatedEnvelope`, and `matchPolymorphicRelation` no longer use `as any` to bridge registry/discriminator correlation. Dispatch is exhaustive over the closed discriminators.

### Endpoint response binding

`RouteResponseBinding` was added to the manifest IR. The route now carries the already-bound response variant:

```text
resource
collection
paginated
custom
empty
```

`buildResponseReference()` consumes this binding directly. It no longer derives response identity from:

```text
controller + action + resource name
```

and no longer guesses collection shape from route names or path text.

The resource map is therefore no longer a dependency of response-reference construction.

### Pagination consistency

The interface now makes invalid states unrepresentable:

```text
paginated → present pagination
resource   → no pagination
collection → no pagination
empty      → no pagination
custom     → none | present
```

### DTO semantic preservation

Named response DTO properties now become a semantic `ReferenceType` instead of being compressed to `PrimitiveKind.UNKNOWN`.

Nullable DTO properties wrap the preserved semantic type with `NullableType`.

### Response emission

Response descriptor emission derives requiredness from the canonical semantic type instead of reading `ResourceFieldDescriptor.nullable`.

## Dataflow invariant

The repaired path is:

```text
verified Laravel response
  → semantic response binding
  → manifest route.response
  → Endpoint IR
  → lowerer
```

There is no response re-classification from controller/action/resource naming in the repaired endpoint path.

## Verification

Focused `tsc --strict` checks were run for:

- `responseShapes.ts`
- `endpointRefs.ts`
- `responseDescriptors.ts`

The changed files themselves reported no TypeScript errors in those focused checks.

A full workspace build/test is still not claimed because the supplied project basis has no root `tsconfig.json` and its installed dependency tree is not present in the ZIP. The remaining dependency errors are therefore environment/repository-basis issues rather than evidence that the focused changed files are type-invalid.

## Remaining boundary

The next trace should continue into the legacy `ResponseBody` / `ObjectSchema` family. It still represents semantic names and types as plain strings and contains optional property channels. That layer is now the main remaining response-side semantic compression point.
