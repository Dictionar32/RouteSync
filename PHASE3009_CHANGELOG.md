# Phase 3009 changelog

- Made the CLI manifest composition input an operational ADT with `continueToCanonicalization`.
- Added the interface-first `controllerInvocationManifestCompositionInputFactory` canonical constructor.
- Migrated scan, sync, and drift-audit call sites away from raw input literals.
- Changed the composition authority to delegate source-project canonicalization through the input operation.
- Removed unnecessary whole-input transport from internal discovery/read/manifest operations; the route-selection intent now travels explicitly as the field it is.
- Added runtime field-provenance documentation and a repeatable structural audit.
- Preserved the empty `collections.ts` invariant and kept deleted relation foundations absent.
