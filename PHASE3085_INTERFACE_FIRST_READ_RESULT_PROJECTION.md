# Phase 3085 — Interface-first read-result projection

## Correction

The prior Phase 3084 still left a named function declaration pattern in the upstream authority:

`const readResultsFromBindings = (bindings): ReadResult[] => { ... }`

That did not fully follow the requested `export const name: Interface = { ... }` convention. Phase 3085 replaces the helper with the exported domain operation `phpSourceDocumentIdentityBindingReadResultProjection`, typed by `PhpSourceDocumentIdentityBindingReadResultProjectionInterface` and frozen as an object.

## Runtime application

Both bound and rejected identity-batch judgments now derive their `readResults()` projection through:

`phpSourceDocumentIdentityBindingReadResultProjection.project(bindings)`

The CLI runtime continues to consume `boundBatch.readResults()` at the existing core/CLI boundary. `bindings` remains the canonical stored evidence; the ordered result list is derived and frozen.

## Scope and verification

The focused audit checks the interface-first export, absence of the old helper, use by both batch outcomes, immutable ordered projection, and TypeScript syntax transpilation. It does not claim that the internal projection loop is eliminated or that strict whole-workspace typecheck, full tests, or end-to-end PHP → CLI → manifest → generator have passed.
