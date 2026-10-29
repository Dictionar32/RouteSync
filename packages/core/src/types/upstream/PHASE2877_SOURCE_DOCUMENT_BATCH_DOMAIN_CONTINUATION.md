# Phase2877 — Source Document Batch Domain Continuation

## Goal

Move the completeness decision for a batch of bound source-document read results into a domain-specific ADT in `phpSourceFrontendInterface.ts`. The CLI composition should consume the ADT's continuation operation rather than inspect `blockedReads.length` to decide whether the manifest may proceed.

## Existing contract evolved

The existing `PhpSourceDocumentReadResult` and its `continueWith(...)` operation remain the source of truth for each individual read. This phase adds a batch-level domain contract alongside it:

- `PhpSourceDocumentReadBatchCompleteEvidence`: all results are complete; carries documents and an explicitly empty blocker tuple.
- `PhpSourceDocumentReadBatchBlockedEvidence`: at least one read is blocked; carries partial documents and a non-empty tuple of blocker evidence.
- `PhpSourceDocumentReadBatchJudgment`: both outcomes expose `continueWith(...)`.
- `PhpSourceDocumentReadBatchFactoryInterface` / `phpSourceDocumentReadBatchFactory`: producer-side aggregation contract and implementation.

No generic `Result<T>` domain abstraction was introduced. The generic result parameter exists only on the continuation handler operation, so each consumer can select its own return type.

## Runtime trace

`controllerInvocationManifestBuilder.build` → scan operation factory → `RouteSyncCliManifestScanOperationInterface.scan` → composition authority → project canonicalization continuation → discovery continuation → source reads → identity binding continuation → `phpSourceDocumentReadBatchFactory.fromResults(...).continueWith(...)` → either source-documents-blocked terminal or `continueWithCompleteDocuments(...)` → invocation pipeline → inventory closure → `ManifestBuilderJudgment.continueWith(...)` → terminal manifest operation.

## Behavioral invariants

- A blocked read cannot be mistaken for an empty successful source set.
- Partial successful documents are preserved in the blocked terminal.
- The batch factory delegates per-item classification to each read result's domain operation.
- Composition no longer decides completeness using a blocker count.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Verification boundary

`audit:phase2877-source-document-batch-domain-continuation` checks source structure and invariants. It is not a TypeScript typecheck or end-to-end test. Full typecheck/build status must be reported separately after running with the repository's intended dependency installation and compiler version.
