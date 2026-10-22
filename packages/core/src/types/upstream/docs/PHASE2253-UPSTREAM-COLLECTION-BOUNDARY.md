# Phase 2253 — Upstream Collection Boundary

## Implementation changes

- `types/upstream/collections.ts` now owns the closed `Sequence<T>` ADT rather than importing/re-exporting it from `semantic/relations`.
- The existing `matchLookup`, `matchSourceDiscovery`, and `matchDiscovered` operations now eliminate their own upstream ADTs directly, without relation-fold/refinement helpers.
- `compiler/scanner/wiring/laravelSourceAstPipeline.ts` no longer imports `semantic/relations` for sequence construction, source discovery, contextual-attribute uniqueness, or resource artifact projection.

## Scope and remaining debt

This is an actual upstream type/implementation cutover, not full scanner retirement. The source-AST pipeline still imports implementations from `scanner/subscanners` for model, form request, migration, attribute, DTO, query, service, middleware, provider, response, and channel acquisition. Those dependencies must be migrated to the existing upstream scanner contracts and canonical evidence owners before the directory can be retired. The broader repository also still contains `semantic/relations` imports outside these two files. No claim of repository-wide relation/foundation closure is made.

## Verification

Run `node scripts/audits/test-phase2253-upstream-collection-boundary.cjs` from the repository root. This structural audit does not replace TypeScript typechecking or runtime tests.
