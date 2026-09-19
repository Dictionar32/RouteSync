# PHASE ERROR REPAIR 06 — HTTP ERROR SCHEMA

## Root
`HttpErrorSchema` was already complete in the scanner error factories, but `matchHttpError()` created an incomplete fallback descriptor when called with `HttpErrorKind`:

```ts
schema: Object.freeze({})
```

That violated the canonical `HttpErrorSchema` contract (`kind` + `fields`) and discarded known Laravel error response semantics.

## Trace

```text
HttpErrorKind
  ↓
matchHttpError(kind)
  ↓
HTTP_ERROR_KIND_REGISTRY
  ↓
previously schema: {}
```

The scanner producer was checked separately:

```text
ScannedHttpErrorResponseDescriptor
  ↓
errorFactories.ts
  ├── message schema
  └── validation schema (message + errors)
```

Therefore the missing meaning was specifically at the domain factory/matcher boundary, not the scanner.

## Repair
Added canonical `HTTP_ERROR_SCHEMA_REGISTRY` in `httpErrors.ts`:

- validation → object schema with `message` and `errors`
- unauthorized → object schema with `message`
- forbidden → object schema with `message`
- notFound → object schema with `message`
- serverError → object schema with `message`
- custom → object schema with `message`

`matchHttpError()` now obtains the schema from this registry instead of producing `{}`.

The new registry type is also exposed through the existing `types/route.ts` barrel where applicable.

## Invariant

```text
No empty HttpErrorSchema
No null schema
No unknown schema
No schema reconstruction downstream
```

## Verification

- Search for `schema: Object.freeze({})` / `schema: {}` in the HTTP-error domain/factory: **none found**.
- TypeScript diagnostics filtered to `httpErrors.ts` after the repair: **none**.
- The broader targeted compile remains blocked by the pre-existing legacy `types/route.ts` export drift (many unrelated missing exports from `./domain`). That is a separate root and was not masked or repaired here.

## Status
Root 06 HTTP error schema producer/matcher repair: **completed at its own boundary**.

Next root: legacy `types/route.ts` export drift. Trace consumers before deciding migration/removal; do not blindly re-export the old API.
