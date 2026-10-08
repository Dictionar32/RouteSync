# Phase 771 — HTTP Error Name Upstream Canonicalization

## Diagnostic frontier

`capabilityBuilder` now reaches the upstream `HttpErrorResponse` boundary. The remaining DTS error was:

```text
HttpErrorResponse.name.value: string is not assignable to StringValue
```

The cause was a second semantic identity for `HttpErrorName` in `types/domain/semanticValues.ts` while the upstream route error vocabulary already required `upstream/names.HttpErrorName`.

## Model correction

`HttpErrorName` is now owned only by `packages/core/src/types/upstream/names.ts`.

The upstream constructor is:

```ts
createHttpErrorName(value: string): HttpErrorName
```

The domain semantic factory delegates to that constructor rather than creating another `{ kind, value }` shape.

Therefore the data flow is:

```text
Laravel scanner evidence
  -> domain error classification
  -> upstream HttpErrorName
  -> upstream HttpErrorResponse
  -> RouteCapabilityContract.errorResponses
```

There is no `HttpErrorName` domain duplicate and no `unknown`/cast bridge for this boundary.

## Architectural rule

Do not introduce:

- `CanonicalHttpErrorName`
- `ParsedHttpErrorName`
- `SemanticHttpErrorName`
- another descriptor-shaped name value

The upstream name ADT is the authority.

## Next frontier

After the build passes, continue the same trace through HTTP error response construction itself. The remaining `HttpErrorResponseDescriptor` API is a legacy domain descriptor candidate and should be evaluated against the existing upstream `HttpErrorResponse` ADT rather than receiving another adapter descriptor.
