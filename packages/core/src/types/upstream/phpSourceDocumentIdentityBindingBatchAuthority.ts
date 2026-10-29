import type { PhpSourceDocumentReadResult } from './phpSourceFrontendInterface';
import type {
  PhpSourceDocumentIdentityBindingBatchBoundEvidence,
  PhpSourceDocumentIdentityBindingBatchOpenAccumulator,
  PhpSourceDocumentIdentityBindingBatchRejectedAccumulator,
  PhpSourceDocumentIdentityBindingBatchAccumulator,
  PhpSourceDocumentIdentityBindingBatchFactoryInterface,
  PhpSourceDocumentIdentityBindingBatchJudgment,
  PhpSourceDocumentIdentityBindingBatchRejectedEvidence,
  PhpSourceDocumentIdentityBindingBatchReadInput,
  PhpSourceDocumentIdentityBindingReadResultProjectionInterface,
  PhpSourceDocumentIdentityBindingInterface,
  PhpSourceDocumentIdentityBindingJudgment,
  PhpSourceDocumentIdentityBoundEvidence,
  PhpSourceDocumentIdentityRejectedEvidence,
} from './phpSourceDocumentIdentityBindingInterface';

/** Identity-binding accumulation is monotonic: a rejected state can retain later successes but never become bound. */
type IdentityBindingBatchOpenAccumulator = PhpSourceDocumentIdentityBindingBatchOpenAccumulator;
type IdentityBindingBatchRejectedAccumulator = PhpSourceDocumentIdentityBindingBatchRejectedAccumulator;
type IdentityBindingBatchAccumulator = PhpSourceDocumentIdentityBindingBatchAccumulator;
type BoundIdentity = PhpSourceDocumentIdentityBoundEvidence;
type RejectedIdentity = PhpSourceDocumentIdentityRejectedEvidence;
type RejectionInventory = PhpSourceDocumentIdentityBindingBatchRejectedEvidence['rejections'];

export const phpSourceDocumentIdentityBindingReadResultProjection: PhpSourceDocumentIdentityBindingReadResultProjectionInterface = Object.freeze({
  kind: 'php_source_document_identity_binding_read_result_projection',
  project: (bindings: readonly BoundIdentity[]): readonly PhpSourceDocumentReadResult[] => {
    const readResults: PhpSourceDocumentReadResult[] = [];
    for (const binding of bindings) readResults.push(binding.result);
    return Object.freeze(readResults);
  },
});

const boundBatch = (bindings: readonly BoundIdentity[]): PhpSourceDocumentIdentityBindingBatchJudgment => {
  const evidence: PhpSourceDocumentIdentityBindingBatchBoundEvidence = Object.freeze({
    kind: 'php_source_document_identity_binding_batch_bound',
    bindings,
    readResults: () => phpSourceDocumentIdentityBindingReadResultProjection.project(bindings),
    toSourceReadBatch: factory => factory.fromResults(phpSourceDocumentIdentityBindingReadResultProjection.project(bindings)),
  });
  return evidence;
};

const rejectedBatch = (
  bindings: readonly BoundIdentity[],
  rejections: RejectionInventory,
): PhpSourceDocumentIdentityBindingBatchJudgment => {
  let evidence: PhpSourceDocumentIdentityBindingBatchRejectedEvidence;
  evidence = Object.freeze({
    kind: 'php_source_document_identity_binding_batch_rejected',
    bindings,
    readResults: () => phpSourceDocumentIdentityBindingReadResultProjection.project(bindings),
    rejections,
    preserveRejectedEvidence: () => evidence,
  });
  return evidence;
};

const createRejectedAccumulator = (
  bindings: readonly BoundIdentity[],
  rejections: RejectionInventory,
): IdentityBindingBatchRejectedAccumulator => Object.freeze({
  kind: 'identity_binding_batch_rejected_accumulator',
  includeBound: (binding: BoundIdentity) => createRejectedAccumulator(Object.freeze([...bindings, binding]), rejections),
  includeRejected: (rejection: RejectedIdentity) => createRejectedAccumulator(
    bindings,
    Object.freeze([...rejections, rejection]) as RejectionInventory,
  ),
  finish: () => rejectedBatch(bindings, rejections),
});

const createOpenAccumulator = (bindings: readonly BoundIdentity[]): IdentityBindingBatchOpenAccumulator => Object.freeze({
  kind: 'identity_binding_batch_open',
  includeBound: (binding: BoundIdentity) => createOpenAccumulator(Object.freeze([...bindings, binding])),
  includeRejected: (rejection: RejectedIdentity) => createRejectedAccumulator(
    bindings,
    Object.freeze([rejection]) as RejectionInventory,
  ),
  finish: () => boundBatch(bindings),
});

export const phpSourceDocumentIdentityBindingBatchFactory: PhpSourceDocumentIdentityBindingBatchFactoryInterface = Object.freeze({
  kind: 'php_source_document_identity_binding_batch_factory',
  fromJudgments: (judgments: readonly PhpSourceDocumentIdentityBindingJudgment[]): PhpSourceDocumentIdentityBindingBatchJudgment => {
    let accumulator: IdentityBindingBatchAccumulator = createOpenAccumulator(Object.freeze([]));
    for (const judgment of judgments) {
      accumulator = judgment.contributeToBatch(accumulator);
    }
    return accumulator.finish();
  },
  bindReads: (
    reads: readonly PhpSourceDocumentIdentityBindingBatchReadInput[],
    binding: Pick<PhpSourceDocumentIdentityBindingInterface, 'bind'>,
  ): PhpSourceDocumentIdentityBindingBatchJudgment => {
    const judgments: PhpSourceDocumentIdentityBindingJudgment[] = [];
    for (const read of reads) judgments.push(binding.bind(Object.freeze({
      kind: 'php_source_document_identity_binding_input',
      requestedSourceFile: read.requestedSourceFile,
      result: read.result,
    })));
    return phpSourceDocumentIdentityBindingBatchFactory.fromJudgments(Object.freeze(judgments));
  },
});
