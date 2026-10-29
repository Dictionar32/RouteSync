# Phase 2893 — Source-read operation rejection

## Runtime trace

`CLI scan/sync/drift audit → controllerInvocationManifestBuilder.build → composition authority → source discovery → sourceDocumentReader.read batch → identity binding batch → source-read batch judgment → semantic judgment preparation → inventory closure → manifest builder → CLI projection`.

## Change

A reader dependency that rejects its promise is now represented by the distinct CLI terminal ADT `controller_invocation_manifest_source_document_read_operation_rejected`. The terminal carries the affected `SourceFile` values and exposes `continueForDriftAudit`; scan, sync, and drift-audit consumers terminate with an explicit diagnostic. Such a failure is not mislabeled as an ordinary filesystem blocker and cannot fall through to an empty successful manifest.

The reader's normal domain outcomes remain handled by the existing upstream `PhpSourceDocumentReadResult` and `PhpSourceDocumentReadBatchJudgment` contracts. No generic collection ADT was introduced; `packages/core/src/types/upstream/collections.ts` remains empty.

## Design boundary

The composition boundary must distinguish (1) reader returned a `complete` or `blocked` judgment from (2) the reader operation itself rejected. The rejected-operation terminal deliberately records source identity, not the raw thrown value, so CLI output does not serialize arbitrary exception objects.

## Validation

Run `npm run audit:phase2893-source-read-operation-rejection`. This is a structural audit only. Full TypeScript typecheck, build, tests, and CLI end-to-end are not claimed unless separately executed successfully.
