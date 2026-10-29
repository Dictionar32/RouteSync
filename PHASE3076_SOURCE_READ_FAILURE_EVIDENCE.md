# Phase 3076 — Source Read Failure Evidence Normalization

## Scope

This phase continues the real upstream → CLI → manifest path after Phase 3075. It closes one data-leak boundary: rejected source-read Promise values no longer cross into the upstream `PhpSourceDocumentReadOperationRejectedEvidence` as `unknown`.

## Domain change

`packages/core/src/types/upstream/phpSourceFrontendInterface.ts` now defines `PhpSourceDocumentReadFailureEvidence` with a closed `FilesystemFailureCode` and normalized `StringValue` diagnostics (`failureName`, `failureMessage`). The rejected settlement carries that evidence and exposes `preserveFailureEvidence()` as an explicit domain operation.

`packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` normalizes the rejected host value through the existing Node filesystem observation adapter before constructing the upstream settlement. The source identity remains attached to each rejection, and the existing batch/manifest terminal continues to receive all rejected source-read evidence.

## Runtime trace

```text
CLI scan/sync
  → manifest composition authority
  → discovered source inventory
  → scheduled sourceDocumentReader.read(sourceFile)
  → fulfilled read judgment OR Node adapter rejection normalization
  → PhpSourceDocumentReadOperationSettlement
  → PhpSourceDocumentReadOperationBatchFactory
  → source-document-read-operation-rejected manifest terminal
```

A rejected read is not reinterpreted as an empty successful source set. The raw host rejection value is normalized at the adapter boundary; the upstream ADT receives only typed diagnostic evidence.

## Interface-first example

```ts
export const phpSourceDocumentReadOperationSettlementFactory: PhpSourceDocumentReadOperationSettlementFactoryInterface = Object.freeze({
  rejected: (sourceFile, failure) => {
    const settlement = Object.freeze({
      kind: 'php_source_document_read_operation_rejected' as const,
      sourceFile,
      failure,
      preserveFailureEvidence: (): PhpSourceDocumentReadFailureEvidence => failure,
    });
    return Object.freeze({
      ...settlement,
      continueWith: <Result>(handlers: PhpSourceDocumentReadOperationSettlementHandlers<Result>): Result => handlers.onRejected(settlement),
    });
  },
});
```

The example illustrates the contract shape; the committed factory implementation may retain an intermediate evidence object to satisfy TypeScript's recursive settlement typing.

## Audit result and limits

The structural audit checks the closed evidence contract, normalization at the adapter boundary, source identity preservation, batch propagation, manifest terminal wiring, interface-first exports, the protected one-byte newline invariant, and absence of deleted relation foundation modules. Regression audits for Phases 3075, 3074, 3072, 3071, 3070, and 3069 are executed by the audit script.

This does not claim whole-workspace strict TypeScript success or end-to-end PHP → CLI → manifest execution. The host adapter still inspects an `unknown` rejection, because JavaScript Promise rejection reasons are not constrained. That primitive is kept at the platform boundary and does not cross into the upstream source-read ADT.

## Next frontier

Replace the generic fulfilled/rejected `continueWith` settlement routing with a source-read domain operation that names its follow-up outcomes. Keep that operation in the upstream source-read domain, preserve every rejected source identity and diagnostic, and avoid a second generic failure foundation.
