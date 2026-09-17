# Interface Trace Audit — Phase 60

## Scope

Interface/ADT only. Producer and consumer flow migration is intentionally deferred.

## Problems removed

1. `RouteResponseAnalysis` no longer uses nullable parallel identity fields (`resourceName | null`, `modelName | null`).
2. Response analysis is a closed ADT: resource, model, inline, or void.
3. `ParsedRoute` no longer duplicates identity, binding, capability and provenance as a second flat field set.
4. Route response analysis no longer carries free-form `responseType` strings or unstructured `reasons` arrays.

## Upstream invariant

A downstream consumer can discriminate on `kind` and receives the identity belonging to that variant. Invalid states such as `kind = resource + modelName = null` are no longer representable in the interface.

## Deliberately deferred

- scanner/producer migration to construct the new `ParsedRoute` shape
- pass/lowerer migration to read nested contracts
- response runtime evidence separation
- identifier branding and full PHP type AST expansion

Those belong after the model is stable. Otherwise the codebase would be doing the usual human trick of changing the plumbing while the pipes are still made of spaghetti.
