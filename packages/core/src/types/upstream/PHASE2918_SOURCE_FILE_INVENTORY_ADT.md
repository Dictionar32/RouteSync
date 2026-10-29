# Phase2918 — SourceFile Inventory ADT

## Root cause

The upstream controller discovery and inventory contracts represented source membership as `readonly SourceFile[]`. That made array operations (`map`, `filter`, `length`, spread copies) the de facto inventory protocol. The CLI and inventory authority therefore owned source-set traversal instead of the source model.

## Upstream correction

`packages/core/src/types/upstream/names.ts` now owns the explicit `SourceFileInventory` ADT:

- `source_file_inventory_empty`
- `source_file_inventory_entry`

Its operations are `include`, `filter`, `countMatching`, `format`, and `continueWith`. This is a source-file domain contract, not a generic collection utility. `packages/core/src/types/upstream/collections.ts` remains empty.

The following upstream contracts now carry `SourceFileInventory` rather than `SourceFile[]`:

- `LaravelControllerSourceInventoryInterface.sources`
- `LaravelControllerSourceDiscoveryEvidence.sources` and `.partialSources`
- `PhpSourceDocumentReadOperationBatchRejectedEvidence.sourceFiles`
- inventory uniqueness and source/judgment correspondence results

The source inventory contract version was advanced to 2, discovery evidence/interface to 3, and inventory closure contract to 13.

## Runtime trace

1. Filesystem discovery begins with `sourceFileInventoryFactory.empty()`.
2. `LaravelControllerSourceDiscoveryResult.includeSource` appends through `SourceFileInventory.include`.
3. A blocked discovery preserves the same typed inventory as `partialSources`.
4. The source-read batch records rejected reads by `SourceFileInventory.include`.
5. CLI reads the discovered inventory through `continueWith`, preserving order and concurrent reads.
6. Inventory authority uses `filter` and `countMatching` to validate uniqueness and one-to-one judgment correspondence.
7. CLI diagnostics use the inventory-owned `format` operation instead of mapping a raw array of source files.

## Validation boundary

The Phase2918 audit checks the source-file inventory contract, traced contracts, CLI usage, exports, and the empty `collections.ts` invariant. Syntax transpilation is separate from a full project typecheck; missing dependencies and pre-existing project diagnostics must not be represented as a passing typecheck.
