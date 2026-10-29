# Phase 3085 changelog

- Replaced `const readResultsFromBindings = (...) => ...` with `export const phpSourceDocumentIdentityBindingReadResultProjection: PhpSourceDocumentIdentityBindingReadResultProjectionInterface = Object.freeze({...})`.
- Added the explicit domain operation interface in `phpSourceDocumentIdentityBindingInterface.ts`.
- Routed both bound and rejected batch read-result projections through the typed operation.
- Updated Phase 3083/3084 structural audit expectations to the new contract and added a focused Phase 3085 runtime audit.
- Preserved canonical identity bindings, rejection evidence, projection ordering, and immutable projected results.
