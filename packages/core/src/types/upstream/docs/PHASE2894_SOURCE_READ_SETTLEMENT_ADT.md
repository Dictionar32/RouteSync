# Phase 2894 — Source-read settlement ADT

## Runtime trace

`CLI scan/sync/drift audit → controllerInvocationManifestBuilder.build → composition authority → source discovery → reader Promise settlement → upstream PhpSourceDocumentReadOperationSettlement → PhpSourceDocumentReadOperationBatchJudgment.continueWith → identity-binding batch → PhpSourceDocumentReadBatchJudgment.continueWith → semantic judgment preparation → inventory closure → manifest builder → CLI output`.

## Change

The source-reader Promise boundary now constructs a named upstream settlement ADT for both outcomes: a fulfilled operation carrying the returned `PhpSourceDocumentReadResult`, and a rejected operation carrying the affected `SourceFile`. `phpSourceDocumentReadOperationBatchFactory.fromSettlements(...)` owns the batch decision and returns an executable fulfilled/rejected batch judgment. Composition delegates to `continueWith` rather than filtering outcomes and branching on the rejected count itself.

This is a domain-specific source-read operation batch, not a generic collection abstraction. The existing `phpSourceFrontendInterface.ts` module is already exported by both upstream and core barrels, so no duplicate barrel contract is added. `packages/core/src/types/upstream/collections.ts` remains empty.

## Remaining boundary

The ADT still uses generic handler return types for continuation, consistent with neighboring upstream judgments. If the desired policy is to eliminate all generics, that requires a concrete domain operation contract rather than replacing the generic with a helper. The CLI terminal still translates rejected operation batches into CLI-specific diagnostics.

## Validation

Run `npm run audit:phase2894-source-read-settlement-adt`. This is a structural audit, not a substitute for TypeScript typecheck, build, unit tests, or CLI end-to-end tests.
