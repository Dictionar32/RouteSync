# Phase 3011 changelog

- Replaced positional argument lists with named, interface-typed input objects for the internal CLI manifest composition operations that carry project identity, route-selection intent, source documents, and inventory validation.
- Kept `discoverySourceProject` separate from `sourceProject` throughout the runtime path.
- Preserved route-selection intent through inventory closure into `manifest_builder_input`.
- Added `scripts/audits/audit-phase3011-manifest-provenance-context.cjs` and `PHASE3011_AUDIT.json` (10/10 structural checks passed).
- Added a scoped TypeScript syntax-transpilation record; full typecheck, unit tests, and Laravel end-to-end remain unverified.
- Preserved the whitespace-only `collections.ts` constraint and did not restore deleted relation foundations.
