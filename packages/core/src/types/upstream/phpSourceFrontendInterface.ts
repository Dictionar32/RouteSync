import type { ExpressionArguments } from './expression';
import type {
  PhpFunctionNameSyntaxEvidence,
  PhpFunctionResolutionSourceInventoryInput,
  PhpFunctionResolutionSourceInventoryObligation,
} from './phpFunctionNameResolutionInterface';
import type { SourceFile, SourceFileInventory } from './names';
import type {
  PhpSourceDocumentIdentityBindingBatchJudgment,
  PhpSourceDocumentIdentityBindingInterface,
  PhpSourceDocumentIdentityBindingJudgment,
} from './phpSourceDocumentIdentityBindingInterface';
import type { FilesystemFailureCode } from './filesystemFailureInterface';
import { sourceFileInventoryFactory } from './names';
import type { SourceSpan } from './provenance';
import { stringValue, type NumberValue, type StringValue } from './valueObjects';

/** Source bytes/text are owned by the frontend; downstream stages receive typed evidence, not reparsed strings. */
/** Immutable source-text payload embedded in a document; it is not a runtime decision ADT. */
export interface PhpSourceTextContent {
  readonly kind: 'php_source_text';
  readonly value: StringValue;
}

export interface PhpSourceDocument {
  readonly kind: 'php_source_document';
  readonly sourceFile: SourceFile;
  readonly content: PhpSourceTextContent;
}

/** Domain value with an operation to bind its payload to discovered source identity. */
export interface PhpSourceText extends PhpSourceTextContent {
  /** Domain continuation: bind decoded source text to its discovered source identity. */
  readonly bindTo: (sourceFile: SourceFile) => PhpSourceDocument;
}

/** Explicit contract for constructing source-domain text at scanner ingress boundaries. */
export interface PhpSourceTextFactoryInterface {
  readonly kind: 'php_source_text_factory';
  readonly create: (value: StringValue) => PhpSourceText;
}

/** Interface-first runtime export; callers use the named domain operation. */
export const phpSourceTextFactory: PhpSourceTextFactoryInterface = Object.freeze({
  kind: 'php_source_text_factory',
  create: (value: StringValue): PhpSourceText => {
    const sourceContent: PhpSourceTextContent = Object.freeze({
      kind: 'php_source_text',
      value,
    });

    return Object.freeze({
      ...sourceContent,
      bindTo: (sourceFile: SourceFile): PhpSourceDocument => Object.freeze({
        kind: 'php_source_document',
        sourceFile,
        content: sourceContent,
      }),
    });
  },
});


/** Each source-read blocker owns its domain continuation, not only diagnostic data. */
export interface PhpSourceDocumentReadBlockerHandlers<Result> {
  readonly onFileMissing: (blocker: Extract<PhpSourceDocumentReadBlockerEvidence, { readonly kind: 'php_source_document_file_missing' }>) => Result;
  readonly onPathNotFile: (blocker: Extract<PhpSourceDocumentReadBlockerEvidence, { readonly kind: 'php_source_document_path_not_file' }>) => Result;
  readonly onFileUnreadable: (blocker: Extract<PhpSourceDocumentReadBlockerEvidence, { readonly kind: 'php_source_document_file_unreadable' }>) => Result;
  readonly onFailureCodeUnrecognized: (blocker: Extract<PhpSourceDocumentReadBlockerEvidence, { readonly kind: 'php_source_document_failure_code_unrecognized' }>) => Result;
}

export interface PhpSourceDocumentReadBlockerOperations {
  readonly continueWith: <Result>(handlers: PhpSourceDocumentReadBlockerHandlers<Result>) => Result;
}

export type PhpSourceDocumentReadBlockerEvidence =
  | Readonly<{ readonly kind: 'php_source_document_file_missing'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'php_source_document_path_not_file'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'php_source_document_file_unreadable'; readonly sourceFile: SourceFile }>
  | Readonly<{ readonly kind: 'php_source_document_failure_code_unrecognized'; readonly sourceFile: SourceFile }>;

export type PhpSourceDocumentReadBlocker =
  | (Extract<PhpSourceDocumentReadBlockerEvidence, { readonly kind: 'php_source_document_file_missing' }> & PhpSourceDocumentReadBlockerOperations)
  | (Extract<PhpSourceDocumentReadBlockerEvidence, { readonly kind: 'php_source_document_path_not_file' }> & PhpSourceDocumentReadBlockerOperations)
  | (Extract<PhpSourceDocumentReadBlockerEvidence, { readonly kind: 'php_source_document_file_unreadable' }> & PhpSourceDocumentReadBlockerOperations)
  | (Extract<PhpSourceDocumentReadBlockerEvidence, { readonly kind: 'php_source_document_failure_code_unrecognized' }> & PhpSourceDocumentReadBlockerOperations);

export interface PhpSourceDocumentReadBlockerFactoryInterface {
  readonly fileMissing: (sourceFile: SourceFile) => Extract<PhpSourceDocumentReadBlocker, { readonly kind: 'php_source_document_file_missing' }>;
  readonly pathNotFile: (sourceFile: SourceFile) => Extract<PhpSourceDocumentReadBlocker, { readonly kind: 'php_source_document_path_not_file' }>;
  readonly fileUnreadable: (sourceFile: SourceFile) => Extract<PhpSourceDocumentReadBlocker, { readonly kind: 'php_source_document_file_unreadable' }>;
  readonly failureCodeUnrecognized: (sourceFile: SourceFile) => Extract<PhpSourceDocumentReadBlocker, { readonly kind: 'php_source_document_failure_code_unrecognized' }>;
}

/** Variant-owned constructors attach follow-up behavior at the upstream contract boundary. */
export const phpSourceDocumentReadBlockerFactory: PhpSourceDocumentReadBlockerFactoryInterface = Object.freeze({
  fileMissing: sourceFile => {
    const evidence: Extract<PhpSourceDocumentReadBlockerEvidence, { readonly kind: 'php_source_document_file_missing' }> = Object.freeze({ kind: 'php_source_document_file_missing', sourceFile });
    return Object.freeze({ ...evidence, continueWith: <Result>(handlers: PhpSourceDocumentReadBlockerHandlers<Result>): Result => handlers.onFileMissing(evidence) });
  },
  pathNotFile: sourceFile => {
    const evidence: Extract<PhpSourceDocumentReadBlockerEvidence, { readonly kind: 'php_source_document_path_not_file' }> = Object.freeze({ kind: 'php_source_document_path_not_file', sourceFile });
    return Object.freeze({ ...evidence, continueWith: <Result>(handlers: PhpSourceDocumentReadBlockerHandlers<Result>): Result => handlers.onPathNotFile(evidence) });
  },
  fileUnreadable: sourceFile => {
    const evidence: Extract<PhpSourceDocumentReadBlockerEvidence, { readonly kind: 'php_source_document_file_unreadable' }> = Object.freeze({ kind: 'php_source_document_file_unreadable', sourceFile });
    return Object.freeze({ ...evidence, continueWith: <Result>(handlers: PhpSourceDocumentReadBlockerHandlers<Result>): Result => handlers.onFileUnreadable(evidence) });
  },
  failureCodeUnrecognized: sourceFile => {
    const evidence: Extract<PhpSourceDocumentReadBlockerEvidence, { readonly kind: 'php_source_document_failure_code_unrecognized' }> = Object.freeze({ kind: 'php_source_document_failure_code_unrecognized', sourceFile });
    return Object.freeze({ ...evidence, continueWith: <Result>(handlers: PhpSourceDocumentReadBlockerHandlers<Result>): Result => handlers.onFailureCodeUnrecognized(evidence) });
  },
});

export type PhpSourceDocumentReadCompleteEvidence = Readonly<{
  readonly kind: 'php_source_document_read_complete';
  readonly document: PhpSourceDocument;
}>;

export type PhpSourceDocumentReadBlockedEvidence = Readonly<{
  readonly kind: 'php_source_document_read_blocked';
  readonly sourceFile: SourceFile;
  readonly blocker: PhpSourceDocumentReadBlocker;
}>;

/**
 * Read-result domain operations are owned by the source-read ADT. `contributeToBatch`
 * carries the result into the next source-read batch state without exposing a generic
 * callback/visitor contract to the accumulator.
 *
 * `continueWith` remains temporarily for compatibility with existing identity-binding
 * consumers; migration of those consumers is tracked as a separate frontier.
 */
/** Identity binding is a source-domain follow-up, with one named operation per read judgment. */
export interface PhpSourceDocumentReadIdentityBindingOperations {
  readonly bindCompleteResult: (
    requestedSourceFile: SourceFile,
    result: PhpSourceDocumentReadCompleteEvidence,
  ) => PhpSourceDocumentIdentityBindingJudgment;
  readonly bindBlockedResult: (
    requestedSourceFile: SourceFile,
    result: PhpSourceDocumentReadBlockedEvidence,
  ) => PhpSourceDocumentIdentityBindingJudgment;
}

export interface PhpSourceDocumentReadResultOperations {
  readonly contributeToBatch: (accumulator: PhpSourceDocumentReadBatchAccumulator) => PhpSourceDocumentReadBatchAccumulator;
  readonly bindIdentity: (
    requestedSourceFile: SourceFile,
    operations: PhpSourceDocumentReadIdentityBindingOperations,
  ) => PhpSourceDocumentIdentityBindingJudgment;
}

export type PhpSourceDocumentReadResult =
  | (PhpSourceDocumentReadCompleteEvidence & PhpSourceDocumentReadResultOperations)
  | (PhpSourceDocumentReadBlockedEvidence & PhpSourceDocumentReadResultOperations);

export interface PhpSourceDocumentReadResultFactoryInterface {
  readonly kind: 'php_source_document_read_result_factory';
  readonly complete: (document: PhpSourceDocument) => Extract<PhpSourceDocumentReadResult, { readonly kind: 'php_source_document_read_complete' }>;
  readonly blocked: (sourceFile: SourceFile, blocker: PhpSourceDocumentReadBlocker) => Extract<PhpSourceDocumentReadResult, { readonly kind: 'php_source_document_read_blocked' }>;
}

/** Constructs each read outcome with its domain continuation at the producer boundary. */
export const phpSourceDocumentReadResultFactory: PhpSourceDocumentReadResultFactoryInterface = Object.freeze({
  kind: 'php_source_document_read_result_factory',
  complete: document => {
    const evidence: PhpSourceDocumentReadCompleteEvidence = Object.freeze({
      kind: 'php_source_document_read_complete',
      document,
    });
    return Object.freeze({
      ...evidence,
      contributeToBatch: (accumulator: PhpSourceDocumentReadBatchAccumulator): PhpSourceDocumentReadBatchAccumulator => accumulator.acceptComplete(evidence.document),
      bindIdentity: (requestedSourceFile: SourceFile, operations: PhpSourceDocumentReadIdentityBindingOperations): PhpSourceDocumentIdentityBindingJudgment => operations.bindCompleteResult(requestedSourceFile, evidence),
    });
  },
  blocked: (sourceFile, blocker) => {
    const evidence: PhpSourceDocumentReadBlockedEvidence = Object.freeze({
      kind: 'php_source_document_read_blocked',
      sourceFile,
      blocker,
    });
    return Object.freeze({
      ...evidence,
      contributeToBatch: (accumulator: PhpSourceDocumentReadBatchAccumulator): PhpSourceDocumentReadBatchAccumulator => accumulator.acceptBlocked(evidence),
      bindIdentity: (requestedSourceFile: SourceFile, operations: PhpSourceDocumentReadIdentityBindingOperations): PhpSourceDocumentIdentityBindingJudgment => operations.bindBlockedResult(requestedSourceFile, evidence),
    });
  },
});

export interface PhpSourceDocumentReadInput {
  readonly kind: 'php_source_document_read_input';
  readonly sourceFile: SourceFile;
}

/** Runtime reader contract: acquire source text; do not infer or classify invocation semantics. */
export interface PhpSourceDocumentReaderInterface {
  readonly kind: 'php_source_document_reader';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly read: (input: PhpSourceDocumentReadInput) => Promise<PhpSourceDocumentReadResult>;
}



/** Normalized filesystem diagnostic evidence; host rejection payloads stop at the CLI adapter boundary. */
export interface PhpSourceDocumentReadFailureEvidence {
  readonly kind: 'php_source_document_read_failure_evidence';
  readonly failureCode: FilesystemFailureCode;
  readonly failureName: StringValue;
  readonly failureMessage: StringValue;
}

/** A settled reader operation distinguishes a returned read judgment from a rejected Promise. */
export interface PhpSourceDocumentReadOperationFulfilledEvidence {
  readonly kind: 'php_source_document_read_operation_fulfilled';
  readonly read: Readonly<{
    readonly requestedSourceFile: SourceFile;
    readonly result: PhpSourceDocumentReadResult;
  }>;
}

export interface PhpSourceDocumentReadOperationRejectedEvidence {
  readonly kind: 'php_source_document_read_operation_rejected';
  readonly sourceFile: SourceFile;
  readonly failure: PhpSourceDocumentReadFailureEvidence;
  readonly preserveFailureEvidence: () => PhpSourceDocumentReadFailureEvidence;
}

/** Batch accumulation is a closed domain state: once a read is rejected, the state cannot return to fulfilled. */
export interface PhpSourceDocumentReadOperationBatchOpenAccumulator {
  readonly kind: 'php_source_document_read_batch_open';
  readonly includeFulfilled: (settlement: PhpSourceDocumentReadOperationFulfilledEvidence) => PhpSourceDocumentReadOperationBatchOpenAccumulator;
  readonly includeRejected: (settlement: PhpSourceDocumentReadOperationRejectedEvidence) => PhpSourceDocumentReadOperationBatchRejectedAccumulator;
  readonly finish: () => PhpSourceDocumentReadOperationBatchFulfilledJudgment;
}

export interface PhpSourceDocumentReadOperationBatchRejectedAccumulator {
  readonly kind: 'php_source_document_read_batch_rejected_accumulator';
  readonly includeFulfilled: (settlement: PhpSourceDocumentReadOperationFulfilledEvidence) => PhpSourceDocumentReadOperationBatchRejectedAccumulator;
  readonly includeRejected: (settlement: PhpSourceDocumentReadOperationRejectedEvidence) => PhpSourceDocumentReadOperationBatchRejectedAccumulator;
  readonly finish: () => PhpSourceDocumentReadOperationBatchRejectedJudgment;
}

export type PhpSourceDocumentReadOperationBatchAccumulator =
  | PhpSourceDocumentReadOperationBatchOpenAccumulator
  | PhpSourceDocumentReadOperationBatchRejectedAccumulator;

export interface PhpSourceDocumentReadOperationSettlementDomainOperations {
  readonly contributeToBatch: (accumulator: PhpSourceDocumentReadOperationBatchAccumulator) => PhpSourceDocumentReadOperationBatchAccumulator;
}

export type PhpSourceDocumentReadOperationSettlement =
  | (PhpSourceDocumentReadOperationFulfilledEvidence & PhpSourceDocumentReadOperationSettlementDomainOperations)
  | (PhpSourceDocumentReadOperationRejectedEvidence & PhpSourceDocumentReadOperationSettlementDomainOperations);

export interface PhpSourceDocumentReadOperationSettlementFactoryInterface {
  readonly kind: 'php_source_document_read_operation_settlement_factory';
  readonly fulfilled: (requestedSourceFile: SourceFile, result: PhpSourceDocumentReadResult) => Extract<PhpSourceDocumentReadOperationSettlement, { readonly kind: 'php_source_document_read_operation_fulfilled' }>;
  readonly rejected: (sourceFile: SourceFile, failure: PhpSourceDocumentReadFailureEvidence) => Extract<PhpSourceDocumentReadOperationSettlement, { readonly kind: 'php_source_document_read_operation_rejected' }>;
}

export const phpSourceDocumentReadOperationSettlementFactory: PhpSourceDocumentReadOperationSettlementFactoryInterface = Object.freeze({
  kind: 'php_source_document_read_operation_settlement_factory',
  fulfilled: (requestedSourceFile, result) => {
    const evidence: PhpSourceDocumentReadOperationFulfilledEvidence = Object.freeze({
      kind: 'php_source_document_read_operation_fulfilled',
      read: Object.freeze({ requestedSourceFile, result }),
    });
    return Object.freeze({
      ...evidence,
      contributeToBatch: (accumulator: PhpSourceDocumentReadOperationBatchAccumulator): PhpSourceDocumentReadOperationBatchAccumulator => accumulator.includeFulfilled(evidence),
    });
  },
  rejected: (sourceFile, failure) => {
    const evidence: Omit<PhpSourceDocumentReadOperationRejectedEvidence, 'preserveFailureEvidence'> = Object.freeze({
      kind: 'php_source_document_read_operation_rejected',
      sourceFile,
      failure,
    });
    const settlement: PhpSourceDocumentReadOperationRejectedEvidence = Object.freeze({
      ...evidence,
      preserveFailureEvidence: (): PhpSourceDocumentReadFailureEvidence => failure,
    });
    return Object.freeze({
      ...settlement,
      contributeToBatch: (accumulator: PhpSourceDocumentReadOperationBatchAccumulator): PhpSourceDocumentReadOperationBatchAccumulator => accumulator.includeRejected(settlement),
    });
  },
});

export interface PhpSourceDocumentReadOperationBatchFulfilledEvidence {
  readonly kind: 'php_source_document_read_operation_batch_fulfilled';
  readonly reads: readonly Readonly<{ readonly requestedSourceFile: SourceFile; readonly result: PhpSourceDocumentReadResult }>[];
}

export interface PhpSourceDocumentReadOperationBatchRejectedEvidence {
  readonly kind: 'php_source_document_read_operation_batch_rejected';
  readonly sourceFiles: SourceFileInventory;
  readonly rejections: readonly PhpSourceDocumentReadOperationRejectedEvidence[];
}

/** Explicit bridge from a fulfilled source-read batch into the identity-binding domain. */
export interface PhpSourceDocumentReadOperationBatchIdentityBindingOperations {
  readonly bindReads: (
    reads: PhpSourceDocumentReadOperationBatchFulfilledEvidence['reads'],
    binding: Pick<PhpSourceDocumentIdentityBindingInterface, 'bind'>,
  ) => PhpSourceDocumentIdentityBindingBatchJudgment;
}

export interface PhpSourceDocumentReadOperationBatchFulfilledJudgment extends PhpSourceDocumentReadOperationBatchFulfilledEvidence {
  readonly bindIdentityBatch: (
    operations: PhpSourceDocumentReadOperationBatchIdentityBindingOperations,
    binding: Pick<PhpSourceDocumentIdentityBindingInterface, 'bind'>,
  ) => PhpSourceDocumentIdentityBindingBatchJudgment;
}

export interface PhpSourceDocumentReadOperationBatchRejectedJudgment extends PhpSourceDocumentReadOperationBatchRejectedEvidence {
  readonly preserveRejectedEvidence: () => PhpSourceDocumentReadOperationBatchRejectedEvidence;
}

export type PhpSourceDocumentReadOperationBatchJudgment =
  | PhpSourceDocumentReadOperationBatchFulfilledJudgment
  | PhpSourceDocumentReadOperationBatchRejectedJudgment;

export interface PhpSourceDocumentReadOperationBatchFactoryInterface {
  readonly kind: 'php_source_document_read_operation_batch_factory';
  readonly fromSettlements: (settlements: readonly PhpSourceDocumentReadOperationSettlement[]) => PhpSourceDocumentReadOperationBatchJudgment;
}

/**
 * The batch state records rejection as a domain transition. `finish` no longer infers
 * success from a rejection-array length; a rejected state is permanently rejected.
 */
export const phpSourceDocumentReadOperationBatchFactory: PhpSourceDocumentReadOperationBatchFactoryInterface = Object.freeze({
  kind: 'php_source_document_read_operation_batch_factory',
  fromSettlements: settlements => {
    const createRejectedAccumulator = (
      reads: readonly Readonly<{ readonly requestedSourceFile: SourceFile; readonly result: PhpSourceDocumentReadResult }>[],
      rejected: readonly PhpSourceDocumentReadOperationRejectedEvidence[],
      sourceFiles: SourceFileInventory,
    ): PhpSourceDocumentReadOperationBatchRejectedAccumulator => Object.freeze({
      kind: 'php_source_document_read_batch_rejected_accumulator',
      includeFulfilled: (settlement: PhpSourceDocumentReadOperationFulfilledEvidence): PhpSourceDocumentReadOperationBatchRejectedAccumulator =>
        createRejectedAccumulator(Object.freeze([...reads, settlement.read]), rejected, sourceFiles),
      includeRejected: (settlement: PhpSourceDocumentReadOperationRejectedEvidence): PhpSourceDocumentReadOperationBatchRejectedAccumulator =>
        createRejectedAccumulator(reads, Object.freeze([...rejected, settlement]), sourceFiles.include(settlement.sourceFile)),
      finish: (): PhpSourceDocumentReadOperationBatchRejectedJudgment => {
        const evidence: PhpSourceDocumentReadOperationBatchRejectedEvidence = Object.freeze({
          kind: 'php_source_document_read_operation_batch_rejected',
          sourceFiles,
          rejections: rejected,
        });
        return Object.freeze({
          ...evidence,
          preserveRejectedEvidence: (): PhpSourceDocumentReadOperationBatchRejectedEvidence => evidence,
        });
      },
    });
    const createOpenAccumulator = (
      reads: readonly Readonly<{ readonly requestedSourceFile: SourceFile; readonly result: PhpSourceDocumentReadResult }>[],
    ): PhpSourceDocumentReadOperationBatchOpenAccumulator => Object.freeze({
      kind: 'php_source_document_read_batch_open',
      includeFulfilled: (settlement: PhpSourceDocumentReadOperationFulfilledEvidence): PhpSourceDocumentReadOperationBatchOpenAccumulator =>
        createOpenAccumulator(Object.freeze([...reads, settlement.read])),
      includeRejected: (settlement: PhpSourceDocumentReadOperationRejectedEvidence): PhpSourceDocumentReadOperationBatchRejectedAccumulator =>
        createRejectedAccumulator(reads, Object.freeze([settlement]), sourceFileInventoryFactory.empty().include(settlement.sourceFile)),
      finish: (): PhpSourceDocumentReadOperationBatchFulfilledJudgment => {
        const evidence: PhpSourceDocumentReadOperationBatchFulfilledEvidence = Object.freeze({
          kind: 'php_source_document_read_operation_batch_fulfilled',
          reads,
        });
        return Object.freeze({
          ...evidence,
          bindIdentityBatch: (
            operations: PhpSourceDocumentReadOperationBatchIdentityBindingOperations,
            binding: Pick<PhpSourceDocumentIdentityBindingInterface, 'bind'>,
          ): PhpSourceDocumentIdentityBindingBatchJudgment => operations.bindReads(evidence.reads, binding),
        });
      },
    });
    /**
     * The settlement inventory is consumed as a domain sequence. Its iteration order
     * is the source-read order; cursor arithmetic is not exposed as runtime knowledge.
     */
    let accumulator: PhpSourceDocumentReadOperationBatchAccumulator = createOpenAccumulator(Object.freeze([]));
    for (const settlement of settlements) {
      accumulator = settlement.contributeToBatch(accumulator);
    }
    return accumulator.finish();
  },
});

/** Aggregate result for a discovered source batch; an empty successful batch is distinct from blocked acquisition. */
export interface PhpSourceDocumentReadBatchCompleteEvidence {
  readonly kind: 'php_source_document_read_batch_complete';
  readonly documents: readonly PhpSourceDocument[];
  readonly blockedReads: readonly [];
}

export interface PhpSourceDocumentReadBatchBlockedEvidence {
  readonly kind: 'php_source_document_read_batch_blocked';
  readonly partialDocuments: readonly PhpSourceDocument[];
  readonly blockedReads: readonly [PhpSourceDocumentReadBlockedEvidence, ...PhpSourceDocumentReadBlockedEvidence[]];
}

/** A complete batch exposes only the documents licensed for semantic analysis. */
export interface PhpSourceDocumentReadBatchCompleteOperations {
  readonly provideDocumentsForSemanticPipeline: () => readonly PhpSourceDocument[];
}

/** A blocked batch preserves partial documents and every blocker as one evidence value. */
export interface PhpSourceDocumentReadBatchBlockedOperations {
  readonly preserveBlockedEvidence: () => PhpSourceDocumentReadBatchBlockedEvidence;
}

/** Each outcome owns the operation valid for its domain state; no generic result handler is needed. */
export type PhpSourceDocumentReadBatchJudgment =
  | (PhpSourceDocumentReadBatchCompleteEvidence & PhpSourceDocumentReadBatchCompleteOperations)
  | (PhpSourceDocumentReadBatchBlockedEvidence & PhpSourceDocumentReadBatchBlockedOperations);

export interface PhpSourceDocumentReadBatchFactoryInterface {
  readonly kind: 'php_source_document_read_batch_factory';
  readonly fromResults: (results: readonly PhpSourceDocumentReadResult[]) => PhpSourceDocumentReadBatchJudgment;
}

/** Domain accumulator: accepting a blocker transitions the batch permanently to blocked. */
interface PhpSourceDocumentReadBatchAccumulator {
  readonly acceptComplete: (document: PhpSourceDocument) => PhpSourceDocumentReadBatchAccumulator;
  readonly acceptBlocked: (blocked: PhpSourceDocumentReadBlockedEvidence) => PhpSourceDocumentReadBatchAccumulator;
  readonly finish: () => PhpSourceDocumentReadBatchJudgment;
}

const completeReadBatchAccumulator = (
  documents: readonly PhpSourceDocument[],
): PhpSourceDocumentReadBatchAccumulator => Object.freeze({
  acceptComplete: document => completeReadBatchAccumulator(Object.freeze([...documents, document])),
  acceptBlocked: blocked => blockedReadBatchAccumulator(documents, Object.freeze([blocked])),
  finish: () => {
    const evidence: PhpSourceDocumentReadBatchCompleteEvidence = Object.freeze({
      kind: 'php_source_document_read_batch_complete',
      documents,
      blockedReads: Object.freeze([]),
    });
    return Object.freeze({
      ...evidence,
      provideDocumentsForSemanticPipeline: (): readonly PhpSourceDocument[] => evidence.documents,
    });
  },
});

const blockedReadBatchAccumulator = (
  partialDocuments: readonly PhpSourceDocument[],
  blockedReads: readonly [PhpSourceDocumentReadBlockedEvidence, ...PhpSourceDocumentReadBlockedEvidence[]],
): PhpSourceDocumentReadBatchAccumulator => Object.freeze({
  acceptComplete: document => blockedReadBatchAccumulator(Object.freeze([...partialDocuments, document]), blockedReads),
  acceptBlocked: blocked => blockedReadBatchAccumulator(partialDocuments, Object.freeze([...blockedReads, blocked]) as readonly [PhpSourceDocumentReadBlockedEvidence, ...PhpSourceDocumentReadBlockedEvidence[]]),
  finish: () => {
    const evidence: PhpSourceDocumentReadBatchBlockedEvidence = Object.freeze({
      kind: 'php_source_document_read_batch_blocked',
      partialDocuments,
      blockedReads,
    });
    return Object.freeze({
      ...evidence,
      preserveBlockedEvidence: (): PhpSourceDocumentReadBatchBlockedEvidence => evidence,
    });
  },
});

/** The batch ADT owns accumulation and terminal classification; callers do not inspect counts or result discriminants. */
export const phpSourceDocumentReadBatchFactory: PhpSourceDocumentReadBatchFactoryInterface = Object.freeze({
  kind: 'php_source_document_read_batch_factory',
  fromResults: results => {
    /**
     * Result ADTs own classification; this domain sequence only preserves order and
     * contributes each result to the current batch state. No index/cursor arithmetic
     * is part of the consumer contract.
     */
    let accumulator: PhpSourceDocumentReadBatchAccumulator = completeReadBatchAccumulator(Object.freeze([]));
    for (const result of results) {
      accumulator = result.contributeToBatch(accumulator);
    }
    return accumulator.finish();
  },
});

/** Parser-owned call evidence before namespace environment projection and name resolution. */
export interface PhpFunctionInvocationSourceSyntaxEvidence {
  readonly kind: 'php_function_invocation_source_syntax_evidence';
  readonly sourceFile: SourceFile;
  readonly source: SourceSpan;
  readonly syntax: PhpFunctionNameSyntaxEvidence;
  readonly arguments: ExpressionArguments;
}

/** Parser failure diagnostics are source evidence, not a semantic judgment. */
export type PhpSourceFrontendParserFailureLocation =
  | Readonly<{ readonly kind: 'php_source_frontend_parser_location_available'; readonly line: NumberValue; readonly column: NumberValue }>
  | Readonly<{ readonly kind: 'php_source_frontend_parser_location_unavailable' }>;

export type PhpSourceFrontendParserFailureDiagnostic =
  | Readonly<{ readonly kind: 'php_source_frontend_parser_error_diagnostic'; readonly message: StringValue; readonly location: PhpSourceFrontendParserFailureLocation }>
  | Readonly<{ readonly kind: 'php_source_frontend_parser_failure_diagnostic_unavailable' }>;

export type PhpSourceFrontendCoverageObligation =
  | PhpFunctionResolutionSourceInventoryObligation
  | 'function-invocation-nodes'
  | 'invocation-argument-lists'
  | 'source-offsets-and-file-identity';

export type PhpSourceInvocationSyntaxInventoryObligation =
  | 'all-function-invocation-nodes-inventoried'
  | 'all-invocation-argument-lists-captured'
  | 'all-callee-syntax-preserved-before-name-resolution';

/** Parser traversal provenance distinguishes whole-file AST evidence from method-body-only token parsing. */
export type PhpSourceFrontendTraversalObligation =
  | 'namespace-region-declarations'
  | 'region-source-boundaries'
  | 'namespace-prefix-import-declarations'
  | 'function-import-declarations'
  | 'named-function-declarations'
  | 'function-invocation-nodes'
  | 'invocation-argument-lists'
  | 'source-offsets-and-file-identity';

export type PhpSourceFrontendTraversalEvidence =
  | Readonly<{
      readonly kind: 'php_source_whole_file_ast_traversal';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly completeness: 'complete';
      readonly obligations: readonly [
        'namespace-region-declarations',
        'region-source-boundaries',
        'namespace-prefix-import-declarations',
        'function-import-declarations',
        'named-function-declarations',
        'function-invocation-nodes',
        'invocation-argument-lists',
        'source-offsets-and-file-identity',
      ];
      readonly unvisitedSyntaxFamilies: readonly [];
    }>
  | Readonly<{
      readonly kind: 'php_source_partial_token_or_method_body_traversal';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly completeness: 'incomplete';
      readonly missingEvidence: readonly [PhpSourceFrontendTraversalObligation, ...PhpSourceFrontendTraversalObligation[]];
    }>;

/** Invocation syntax has its own closed inventory; a raw array cannot claim whole-file completeness. */
export type PhpSourceInvocationSyntaxInventory =
  | Readonly<{
      readonly kind: 'php_source_invocation_syntax_inventory_complete';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly entries: readonly PhpFunctionInvocationSourceSyntaxEvidence[];
      readonly obligations: readonly [
        'all-function-invocation-nodes-inventoried',
        'all-invocation-argument-lists-captured',
        'all-callee-syntax-preserved-before-name-resolution',
      ];
    }>
  | Readonly<{
      readonly kind: 'php_source_invocation_syntax_inventory_incomplete';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly entries: readonly PhpFunctionInvocationSourceSyntaxEvidence[];
      readonly missingEvidence: readonly PhpSourceInvocationSyntaxInventoryObligation[];
    }>;

/** Coverage is a parser-produced claim with an explicit closed outcome; empty lists alone prove nothing. */
export type PhpSourceFrontendCoverage =
  | Readonly<{
      readonly kind: 'php_source_frontend_coverage_complete';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly obligations: readonly [
        'namespace-region-declarations',
        'region-source-boundaries',
        'namespace-prefix-import-declarations',
        'function-import-declarations',
        'named-function-declarations',
        'function-invocation-nodes',
        'invocation-argument-lists',
        'source-offsets-and-file-identity',
      ];
    }>
  | Readonly<{
      readonly kind: 'php_source_frontend_coverage_incomplete';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly missingEvidence: readonly PhpSourceFrontendCoverageObligation[];
    }>
  | Readonly<{
      readonly kind: 'php_source_frontend_parse_blocked';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly failure: Readonly<{ readonly kind: 'php_source_frontend_parser_rejected_source'; readonly diagnostic: PhpSourceFrontendParserFailureDiagnostic }>;
    }>;

/** One frontend extraction keeps whole-file scope and call syntax in the same provenance domain. */
export interface PhpSourceFrontendExtraction {
  readonly kind: 'php_source_frontend_extraction';
  readonly sourceFile: SourceFile;
  readonly source: SourceSpan;
  readonly nameResolutionInventory: PhpFunctionResolutionSourceInventoryInput;
  readonly invocationInventory: PhpSourceInvocationSyntaxInventory;
  readonly traversal: PhpSourceFrontendTraversalEvidence;
  readonly coverage: PhpSourceFrontendCoverage;
}

export interface PhpSourceFrontendContract {
  readonly kind: 'php_source_frontend_contract';
  readonly version: 7;
  readonly unsupportedInvocationHandling: 'every-parser-call-node-must-be-inventoried-or-force-an-incomplete-invocation-inventory; unsupported-callee-shapes-must-never-be-silently-dropped';
  readonly extractionRuleOrder: readonly [
    'preserve-one-source-file-identity-through-whole-file-extraction',
    'bind-coverage-claims-to-an-explicit-parser-traversal-witness',
    'only-whole-file-ast-traversal-may-claim-complete-source-coverage',
    'inventory-every-namespace-region-import-and-named-function-declaration',
    'inventory-every-ordinary-function-call-and-its-arguments-through-a-closed-invocation-inventory',
    'preserve-callee-segment-syntax-before-name-resolution',
    'bind-every-source-span-to-the-same-whole-file-source',
    'derive-name-resolution-inventory-completeness-only-from-region-import-declaration-evidence',
    'derive-invocation-inventory-completeness-only-from-invocation-callee-argument-evidence',
    'require-both-closed-inventories-before-aggregate-complete-coverage',
    'preserve-parser-rejection-diagnostic-without-promoting-a-partial-or-missing-ast',
    'publish-incomplete-coverage-instead-of-inferring-completeness-from-empty-evidence',
    'never-resolve-names-or-create-invocation-judgments-in-the-frontend',
  ];
  readonly ownership: 'frontend-owns-parsing-and-source-evidence-only-semantic-meaning-belongs-to-upstream-authorities';
  readonly scope: 'whole-file-namespace-import-declaration-and-invocation-inventory-not-method-body-only';
  readonly failure: 'parser-rejection-is-a-typed-blocker-with-preserved-diagnostic-evidence-and-incomplete-or-unbound-source-evidence-cannot-be-promoted-to-complete-frontend-coverage';
}

export const PHP_SOURCE_FRONTEND_CONTRACT: PhpSourceFrontendContract = Object.freeze({
  kind: 'php_source_frontend_contract',
  version: 7,
  unsupportedInvocationHandling: 'every-parser-call-node-must-be-inventoried-or-force-an-incomplete-invocation-inventory; unsupported-callee-shapes-must-never-be-silently-dropped',
  extractionRuleOrder: Object.freeze([
    'preserve-one-source-file-identity-through-whole-file-extraction',
    'bind-coverage-claims-to-an-explicit-parser-traversal-witness',
    'only-whole-file-ast-traversal-may-claim-complete-source-coverage',
    'inventory-every-namespace-region-import-and-named-function-declaration',
    'inventory-every-ordinary-function-call-and-its-arguments-through-a-closed-invocation-inventory',
    'preserve-callee-segment-syntax-before-name-resolution',
    'bind-every-source-span-to-the-same-whole-file-source',
    'derive-name-resolution-inventory-completeness-only-from-region-import-declaration-evidence',
    'derive-invocation-inventory-completeness-only-from-invocation-callee-argument-evidence',
    'require-both-closed-inventories-before-aggregate-complete-coverage',
    'preserve-parser-rejection-diagnostic-without-promoting-a-partial-or-missing-ast',
    'publish-incomplete-coverage-instead-of-inferring-completeness-from-empty-evidence',
    'never-resolve-names-or-create-invocation-judgments-in-the-frontend',
  ]),
  ownership: 'frontend-owns-parsing-and-source-evidence-only-semantic-meaning-belongs-to-upstream-authorities',
  scope: 'whole-file-namespace-import-declaration-and-invocation-inventory-not-method-body-only',
  failure: 'parser-rejection-is-a-typed-blocker-with-preserved-diagnostic-evidence-and-incomplete-or-unbound-source-evidence-cannot-be-promoted-to-complete-frontend-coverage',
});

/** Interface-first seam for the existing parser or a future PHP parser adapter. */
export interface PhpSourceFrontendInterface {
  readonly kind: 'php_source_frontend';
  readonly contract: PhpSourceFrontendContract;
  readonly extract: (document: PhpSourceDocument) => PhpSourceFrontendExtraction;
}
