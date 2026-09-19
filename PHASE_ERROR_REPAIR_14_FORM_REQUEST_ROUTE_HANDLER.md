# Phase Error Repair 14 — FormRequest / RouteHandler Boundary

## Trace

`FormRequestDescriptor` was carrying semantic fields as primitive strings and its factory synthesized `sourceFile` with a fallback. Route boundary inputs also accepted `string | FormRequestDescriptor`, causing semantic reconstruction downstream.

## Repair

- `FormRequestDescriptor.name` is created as canonical `ClassName`.
- `FormRequestDescriptor.sourceFile` is created as canonical `SourceFilePath`.
- `ScannedFormRequestDescriptor.create()` now requires the source file explicitly.
- Route boundary `formRequests` now accepts only `FormRequestDescriptor`.
- `bindingResolution` no longer reconstructs descriptors or synthesizes paths.
- `actionValidationExtractor` reads `formRequest.name.value` only at the legacy map/string integration boundary.
- `capabilityResolution` reads `first.name.value` at the string-producing integration boundary.
- `actionVariableTracker` requires `sourceFile` when constructing a form request.
- `matchRouteHandler` no longer uses casts to dispatch the tagged union.

## Invariants

- No `string | FormRequestDescriptor` remains in the route boundary.
- No `typeof formRequest === "string"` remains in the binding resolver.
- No implicit `app/Http/Requests/<name>.php` source fallback remains.
- Canonical `FormRequestDescriptor` contains semantic values, not raw strings.

## Verification

`routeHandlers.ts` + `semanticValues.ts` targeted strict compile: PASS.

A wider compile still contains unrelated/in-progress route contract errors (notably duplicated `RouteIdentityContract` definitions and legacy string-based route descriptors). Those are retained as the next route-contract root and were not papered over in this phase.
