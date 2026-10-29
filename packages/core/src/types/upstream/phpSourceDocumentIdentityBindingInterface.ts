import type {
  PhpSourceDocumentReadBatchFactoryInterface,
  PhpSourceDocumentReadBatchJudgment,
  PhpSourceDocumentReadIdentityBindingOperations,
  PhpSourceDocumentReadResult,
} from './phpSourceFrontendInterface';
import type { SourceFile } from './names';

/** Source acquisition identity is checked before a read result can enter a complete inventory. */
export interface PhpSourceDocumentIdentityBindingInput {
  readonly kind: 'php_source_document_identity_binding_input';
  readonly requestedSourceFile: SourceFile;
  readonly result: PhpSourceDocumentReadResult;
}

export interface PhpSourceDocumentIdentityBindingBatchOpenAccumulator {
  readonly kind: 'identity_binding_batch_open';
  readonly includeBound: (binding: PhpSourceDocumentIdentityBoundEvidence) => PhpSourceDocumentIdentityBindingBatchOpenAccumulator;
  readonly includeRejected: (rejection: PhpSourceDocumentIdentityRejectedEvidence) => PhpSourceDocumentIdentityBindingBatchRejectedAccumulator;
  readonly finish: () => PhpSourceDocumentIdentityBindingBatchJudgment;
}

export interface PhpSourceDocumentIdentityBindingBatchRejectedAccumulator {
  readonly kind: 'identity_binding_batch_rejected_accumulator';
  readonly includeBound: (binding: PhpSourceDocumentIdentityBoundEvidence) => PhpSourceDocumentIdentityBindingBatchRejectedAccumulator;
  readonly includeRejected: (rejection: PhpSourceDocumentIdentityRejectedEvidence) => PhpSourceDocumentIdentityBindingBatchRejectedAccumulator;
  readonly finish: () => PhpSourceDocumentIdentityBindingBatchJudgment;
}

export type PhpSourceDocumentIdentityBindingBatchAccumulator =
  | PhpSourceDocumentIdentityBindingBatchOpenAccumulator
  | PhpSourceDocumentIdentityBindingBatchRejectedAccumulator;

/** A binding judgment advances the identity inventory through its domain-owned accumulator operation. */
export interface PhpSourceDocumentIdentityBindingJudgmentOperations {
  readonly contributeToBatch: (
    accumulator: PhpSourceDocumentIdentityBindingBatchAccumulator,
  ) => PhpSourceDocumentIdentityBindingBatchAccumulator;
}

export type PhpSourceDocumentIdentityBoundEvidence = Readonly<{
  readonly kind: 'php_source_document_identity_bound';
  readonly requestedSourceFile: SourceFile;
  readonly result: PhpSourceDocumentReadResult;
}>;

export type PhpSourceDocumentIdentityRejectedEvidence = Readonly<{
  readonly kind: 'php_source_document_identity_rejected';
  readonly requestedSourceFile: SourceFile;
  readonly observedSourceFile: SourceFile;
  readonly result: PhpSourceDocumentReadResult;
}>;

/** Explicit domain operation for projecting ordered read results from the canonical binding evidence. */
export interface PhpSourceDocumentIdentityBindingReadResultProjectionInterface {
  readonly kind: 'php_source_document_identity_binding_read_result_projection';
  readonly project: (bindings: readonly PhpSourceDocumentIdentityBoundEvidence[]) => readonly PhpSourceDocumentReadResult[];
}

/** Identity-binding outcomes expose domain continuation instead of requiring caller-side kind dispatch. */
export type PhpSourceDocumentIdentityBindingJudgment =
  | (PhpSourceDocumentIdentityBoundEvidence & PhpSourceDocumentIdentityBindingJudgmentOperations)
  | (PhpSourceDocumentIdentityRejectedEvidence & PhpSourceDocumentIdentityBindingJudgmentOperations);

export interface PhpSourceDocumentIdentityBindingContract {
  readonly kind: 'php_source_document_identity_binding_contract';
  readonly version: 1;
  readonly rule: 'read-result-source-identity-and-any-blocker-source-identity-must-equal-the-exact-requested-source-file-identity';
  readonly rejection: 'identity-mismatch-is-preserved-as-a-closed-judgment-and-cannot-enter-the-complete-source-inventory';
}

export interface PhpSourceDocumentIdentityBindingInterface extends PhpSourceDocumentReadIdentityBindingOperations {
  readonly kind: 'php_source_document_identity_binding';
  readonly contract: PhpSourceDocumentIdentityBindingContract;
  readonly bind: (input: PhpSourceDocumentIdentityBindingInput) => PhpSourceDocumentIdentityBindingJudgment;
}
/** A domain-owned aggregation of identity binding; consumers cannot independently split the same judgments. */
export interface PhpSourceDocumentIdentityBindingBatchBoundEvidence {
  readonly kind: 'php_source_document_identity_binding_batch_bound';
  readonly bindings: readonly PhpSourceDocumentIdentityBoundEvidence[];
  /** Derived ordered projection; bindings remain the sole stored source of truth. */
  readonly readResults: () => readonly PhpSourceDocumentReadResult[];
  /** Continue successful identity evidence into the source-document read-batch domain. */
  readonly toSourceReadBatch: (factory: PhpSourceDocumentReadBatchFactoryInterface) => PhpSourceDocumentReadBatchJudgment;
}

export interface PhpSourceDocumentIdentityBindingBatchRejectedEvidence {
  readonly kind: 'php_source_document_identity_binding_batch_rejected';
  /** Successful bindings remain available even when another source identity is rejected. */
  readonly bindings: readonly PhpSourceDocumentIdentityBoundEvidence[];
  /** Derived ordered projection; bindings remain the sole stored source of truth. */
  readonly readResults: () => readonly PhpSourceDocumentReadResult[];
  readonly rejections: readonly [
    PhpSourceDocumentIdentityRejectedEvidence,
    ...PhpSourceDocumentIdentityRejectedEvidence[],
  ];
  /** Preserve rejected identity evidence without projecting it into the complete source inventory. */
  readonly preserveRejectedEvidence: () => PhpSourceDocumentIdentityBindingBatchRejectedEvidence;
}

export type PhpSourceDocumentIdentityBindingBatchJudgment =
  | PhpSourceDocumentIdentityBindingBatchBoundEvidence
  | PhpSourceDocumentIdentityBindingBatchRejectedEvidence;

export interface PhpSourceDocumentIdentityBindingBatchReadInput {
  readonly requestedSourceFile: SourceFile;
  readonly result: PhpSourceDocumentReadResult;
}

export interface PhpSourceDocumentIdentityBindingBatchFactoryInterface {
  readonly kind: 'php_source_document_identity_binding_batch_factory';
  readonly fromJudgments: (judgments: readonly PhpSourceDocumentIdentityBindingJudgment[]) => PhpSourceDocumentIdentityBindingBatchJudgment;
  readonly bindReads: (
    reads: readonly PhpSourceDocumentIdentityBindingBatchReadInput[],
    binding: Pick<PhpSourceDocumentIdentityBindingInterface, 'bind'>,
  ) => PhpSourceDocumentIdentityBindingBatchJudgment;
}

