import type { PhpSourceInvocationSemanticPipelineResult } from './phpSourceInvocationSemanticPipelineInterface';

/** A batch whose entries already carry their source identity inside the closed pipeline result. */
export interface PhpSourceInvocationSemanticPipelineDeliveryBatch {
  readonly kind: 'php_source_invocation_semantic_pipeline_delivery_batch';
  readonly contractVersion: 1;
  readonly entries: readonly PhpSourceInvocationSemanticPipelineResult[];
}

export interface PhpSourceInvocationSemanticPipelineDeliveryContract {
  readonly kind: 'php_source_invocation_semantic_pipeline_delivery_contract';
  readonly version: 1;
  readonly identityRule: 'each-delivered-result-retains-the-source-file-identity-of-its-own-whole-file-document';
  readonly consumerRule: 'scanner-consumes-source-bound-results-directly-and-does-not-query-an-index-or-reconstruct-a-source-to-result-join';
  readonly completenessRule: 'each-entry-preserves-the-exact-complete-or-blocked-pipeline-judgment';
}

export const PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_DELIVERY_CONTRACT: PhpSourceInvocationSemanticPipelineDeliveryContract = Object.freeze({
  kind: 'php_source_invocation_semantic_pipeline_delivery_contract',
  version: 1,
  identityRule: 'each-delivered-result-retains-the-source-file-identity-of-its-own-whole-file-document',
  consumerRule: 'scanner-consumes-source-bound-results-directly-and-does-not-query-an-index-or-reconstruct-a-source-to-result-join',
  completenessRule: 'each-entry-preserves-the-exact-complete-or-blocked-pipeline-judgment',
});

/** Named upstream operation: delivery preserves the source-bound result ADT without reclassification. */
export interface PhpSourceInvocationSemanticPipelineDeliveryInterface {
  readonly kind: 'php_source_invocation_semantic_pipeline_delivery';
  readonly contractVersion: 1;
  readonly deliver: (
    entries: readonly PhpSourceInvocationSemanticPipelineResult[],
  ) => PhpSourceInvocationSemanticPipelineDeliveryBatch;
}

export const phpSourceInvocationSemanticPipelineDelivery: PhpSourceInvocationSemanticPipelineDeliveryInterface = Object.freeze({
  kind: 'php_source_invocation_semantic_pipeline_delivery',
  contractVersion: 1,
  deliver: (entries: readonly PhpSourceInvocationSemanticPipelineResult[]): PhpSourceInvocationSemanticPipelineDeliveryBatch => Object.freeze({
    kind: 'php_source_invocation_semantic_pipeline_delivery_batch',
    contractVersion: 1,
    entries: Object.freeze([...entries]),
  }),
});

/** Compatibility entry point delegates to the explicitly modelled upstream operation. */
export const phpSourceInvocationSemanticPipelineDeliveryBatchFromResults = (
  entries: readonly PhpSourceInvocationSemanticPipelineResult[],
): PhpSourceInvocationSemanticPipelineDeliveryBatch => phpSourceInvocationSemanticPipelineDelivery.deliver(entries);
