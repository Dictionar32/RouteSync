# Phase 2769 — Flatten the source-discovery contract

## Root cause removed

The nested `Discovered<T>` union encoded collection cardinality as a second ADT (`discovered_empty` / `discovered_many`) inside `SourceDiscovery<T>`. That forced producers and consumers to branch on a distinction already represented by array length.

## Source-level changes

- Removed the exported `Discovered<T>` type and `matchDiscovered` eliminator.
- Flattened `SourceDiscovery<T>` to `not_scanned | scanned { items: readonly T[] }`. An empty scanned collection is represented by `items: []`; no `discovered_empty`/`discovered_many` wrapper exists.
- Changed the source-AST pipeline and both FormRequest collection producers to emit direct readonly arrays. Removed the FormRequest sequence conversion helpers from these collection-boundary methods.
- Updated manifest lowering and projection inputs to consume `discovery.items` directly.
- Updated source-model construction to consume the flat scanned array. The existing semantic `SourceModelCatalog` still uses its own `Sequence` ADT internally, so this change does not claim to remove `Sequence` from unrelated semantic-model contracts across the repository.

## Verification

Run `npm run audit:phase2769-flat-source-discovery-contract`. This targeted audit verifies that the nested discovery union is gone from the canonical contract and producer/consumer path, and that the touched TypeScript files parse. It is not a full semantic typecheck or end-to-end test.
