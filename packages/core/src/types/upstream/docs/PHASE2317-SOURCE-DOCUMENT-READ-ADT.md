# Phase 2317 — Source Document Read ADT

## Finding
Phase 2316 closed directory discovery, but the CLI composition still used `Promise.all(documentFromFile(...))`. A file removed or made unreadable between discovery and reading escaped the discovery ADT and rejected the composition promise. That broke the invariant that incomplete source acquisition must remain explicit typed data.

## Change
- Added `PhpSourceDocumentReadBlocker`, `PhpSourceDocumentReadResult`, `PhpSourceDocumentReadInput`, and `PhpSourceDocumentReaderInterface` to the existing upstream PHP source frontend contract.
- Replaced throwing `documentFromFile` with an implementation of that reader interface.
- Added `controller_invocation_manifest_source_documents_blocked` to the existing composition terminal ADT. Successful partial reads are preserved, and blocked file identities are retained.
- Updated scan, sync, and drift-audit presentation boundaries to report source-read blockers and set failure exit status.
- No imports from `semantic/foundation` or `semantic/relations` were added.

## Trace
`scan/sync/drift` → composition → source discovery ADT → `PhpSourceDocumentReaderInterface.read` → source-read ADT → if complete, invocation semantic pipeline → inventory authority → manifest builder.

## Validation scope
Structural audit and targeted TypeScript transpilation are run separately. This phase does not claim full workspace typecheck or build success.
