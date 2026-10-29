# Phase 3098 — Source-Read Batch Explicit Domain Operations

## Scope

This phase changes one real runtime boundary: the `PhpSourceDocumentReadBatchJudgment` consumed by `controllerInvocationManifestComposition`. It removes the generic `continueWith<Result>` operation from this batch ADT and replaces it with operations named for the domain responsibilities of each outcome.

## Runtime trace

`CLI scan/sync` → `controllerInvocationManifestCompositionAuthority` → `discoveredSourcesContinuationOperation` → `phpSourceDocumentReadOperationBatchFactory.fromSettlements` → `bindIdentityBatch` → `identityBatch.toSourceReadBatch(phpSourceDocumentReadBatchFactory)` → complete/blocked source-read batch → semantic pipeline or CLI blocked-manifest terminal → manifest builder → generator.

## Code change

`packages/core/src/types/upstream/phpSourceFrontendInterface.ts` now exposes:

- `PhpSourceDocumentReadBatchCompleteOperations.provideDocumentsForSemanticPipeline()` for complete batches.
- `PhpSourceDocumentReadBatchBlockedOperations.preserveBlockedEvidence()` for blocked batches.

`PhpSourceDocumentReadBatchHandlers<Result>` and the batch-level `continueWith<Result>` were removed. The CLI composition now consumes the explicit operation on the relevant union arm. The core package still does not import the CLI-owned `ControllerInvocationManifest` contract.

## Evidence and semantics

- Complete batches preserve the ordered document inventory.
- Blocked batches preserve partial documents and every blocker.
- Identity-rejected batches remain separate from read-blocked batches.
- The CLI remains responsible for turning core evidence into CLI manifest terminals.
- Deleted relation foundation modules are not restored.

## Deliberately not claimed

This is a focused boundary migration, not repository-wide completion. A discriminant branch remains in the CLI composition for choosing the CLI terminal. Other generic continuations elsewhere in the repository remain. The entire repository's exported functions and arrow constants have not all been converted to `export const name: Interface = ...`; requested primitive patterns have not been globally eliminated. Full typecheck, full test suite, and PHP → CLI → manifest → generator E2E are not verified because dependencies are not installed in this workspace.

## Verification

Run `npm run audit:phase3098-source-read-batch-explicit-domain-operations` from the repository root. The audit is a structural source check, not a substitute for typecheck or runtime tests.
