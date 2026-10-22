import type {
  PhpSourceInvocationSemanticPipelineCompositionEvidence,
  PhpSourceInvocationSemanticPipelineComplete,
  PhpSourceInvocationSemanticPipelineBlocked,
} from './phpSourceInvocationSemanticPipelineInterface';
import type { PhpFunctionInvocationSemanticJudgmentBatchClosureResult } from './phpFunctionInvocationSemanticAuthorityInterface';
import type { PhpSourceInvocationSemanticSourceBindingJudgment } from './phpSourceInvocationSemanticSourceBindingInterface';

/**
 * Lossless projection of PHP source-pipeline evidence into the integrated response.
 * A blocked pipeline remains blocked with its exact stage payload; it is never
 * collapsed into a generic pending state that discards the semantic judgment trail.
 */
export type PhpSourceInvocationSemanticPipelineIntegrationResult =
  | Readonly<{
      readonly kind: 'php_source_invocation_integration_not_connected';
      readonly evidence: Extract<
        PhpSourceInvocationSemanticPipelineCompositionEvidence,
        { readonly kind: 'php_source_invocation_pipeline_not_connected' }
      >;
    }>
  | Readonly<{
      readonly kind: 'php_source_invocation_integration_source_binding_rejected';
      readonly judgment: Extract<PhpSourceInvocationSemanticSourceBindingJudgment, { readonly kind: 'php_source_invocation_semantic_source_binding_rejected' }> ;
    }>
  | Readonly<{
      readonly kind: 'php_source_invocation_integration_complete';
      /** The exact upstream source-binding judgment that authorized this pipeline result. */
      readonly sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment, { readonly kind: 'php_source_invocation_semantic_source_binding_closed' }>;
      readonly pipeline: PhpSourceInvocationSemanticPipelineComplete;
      readonly batch: Extract<
        PhpFunctionInvocationSemanticJudgmentBatchClosureResult,
        { readonly kind: 'php_function_invocation_semantic_judgment_batch_validated' }
      >;
    }>
  | Readonly<{
      readonly kind: 'php_source_invocation_integration_blocked';
      /** A blocked result retains the same source-binding proof; blocking is not a binding failure. */
      readonly sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment, { readonly kind: 'php_source_invocation_semantic_source_binding_closed' }>;
      readonly pipeline: PhpSourceInvocationSemanticPipelineBlocked;
    }>;

export interface PhpSourceInvocationSemanticPipelineIntegrationContract {
  readonly kind: 'php_source_invocation_semantic_pipeline_integration_contract';
  readonly version: 11;
  readonly scannerRequirement: 'production-controller-scanner-must-receive-an-authority-produced-whole-file-pipeline-result; method-body-only-ast-evidence-cannot-claim-source-pipeline-connection';
  readonly notConnectedSemantics: 'not-connected-is-a-distinct-non-success-outcome-and-never-an-empty-or-complete-invocation-batch';
  readonly sourceBindingSemantics: 'source-identity-rejection-is-a-distinct-non-success-outcome-and-never-reclassified-as-not-connected-or-blocked-pipeline';
  readonly rejectedEvidencePreservation: 'source-binding-rejection-retains-the-exact-rejected-pipeline-result-through-the-integrated-response';
  readonly deliverySemantics: 'source-bound-results-arrive-as-complete-delivery-entries-and-integration-does-not-perform-index-lookup';
  readonly sourceBindingPreservation: 'complete-and-blocked-outcomes-retain-the-exact-closed-source-binding-judgment-that-authorized-the-pipeline-result';
  readonly sourceIdentityJudgmentPreservation: 'every-source-binding-outcome-retains-the-typed-same-or-different-source-file-identity-judgment';
  readonly inputOutcomeClosure: 'not-connected-evidence-is-typed-to-not-connected-only;connected-or-source-binding-rejected-evidence-cannot-produce-not-connected';
  readonly ruleOrder: readonly [
    'preserve-not-connected-evidence-as-an-explicit-integrated-outcome',
    'preserve-source-binding-rejection-as-its-own-integrated-outcome',
    'consume-source-bound-pipeline-results-without-reconstructing-source-to-result-associations',
    'never-promote-not-connected-evidence-to-complete-or-empty-success',
    'publish-the-exact-authority-closed-batch-with-its-complete-pipeline-result-and-source-binding-judgment',
    'preserve-the-exact-blocked-pipeline-result-and-blocking-stage',
    'never-collapse-blocked-source-semantic-judgments-into-generic-pending-state',
    'never-reconstruct-or-upgrade-semantic-judgments-during-projection',
  ];
}

export const PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_INTEGRATION_CONTRACT: PhpSourceInvocationSemanticPipelineIntegrationContract = Object.freeze({
  kind: 'php_source_invocation_semantic_pipeline_integration_contract',
  version: 11,
  scannerRequirement: 'production-controller-scanner-must-receive-an-authority-produced-whole-file-pipeline-result; method-body-only-ast-evidence-cannot-claim-source-pipeline-connection',
  notConnectedSemantics: 'not-connected-is-a-distinct-non-success-outcome-and-never-an-empty-or-complete-invocation-batch',
  sourceBindingSemantics: 'source-identity-rejection-is-a-distinct-non-success-outcome-and-never-reclassified-as-not-connected-or-blocked-pipeline',
  rejectedEvidencePreservation: 'source-binding-rejection-retains-the-exact-rejected-pipeline-result-through-the-integrated-response',
  deliverySemantics: 'source-bound-results-arrive-as-complete-delivery-entries-and-integration-does-not-perform-index-lookup',
  sourceBindingPreservation: 'complete-and-blocked-outcomes-retain-the-exact-closed-source-binding-judgment-that-authorized-the-pipeline-result',
  sourceIdentityJudgmentPreservation: 'every-source-binding-outcome-retains-the-typed-same-or-different-source-file-identity-judgment',
  inputOutcomeClosure: 'not-connected-evidence-is-typed-to-not-connected-only;connected-or-source-binding-rejected-evidence-cannot-produce-not-connected',
  ruleOrder: Object.freeze([
    'preserve-not-connected-evidence-as-an-explicit-integrated-outcome',
    'preserve-source-binding-rejection-as-its-own-integrated-outcome',
    'consume-source-bound-pipeline-results-without-reconstructing-source-to-result-associations',
    'never-promote-not-connected-evidence-to-complete-or-empty-success',
    'publish-the-exact-authority-closed-batch-with-its-complete-pipeline-result-and-source-binding-judgment',
    'preserve-the-exact-blocked-pipeline-result-and-blocking-stage',
    'never-collapse-blocked-source-semantic-judgments-into-generic-pending-state',
    'never-reconstruct-or-upgrade-semantic-judgments-during-projection',
  ]),
});

export interface PhpSourceInvocationSemanticPipelineIntegrationInterface {
  readonly kind: 'php_source_invocation_semantic_pipeline_integration';
  readonly contract: PhpSourceInvocationSemanticPipelineIntegrationContract;
  /** The absent-pipeline evidence has exactly one admissible integrated outcome. */
  project(
    evidence: Extract<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>,
  ): Extract<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_not_connected' }>;
  /** Bound or rejected pipeline evidence cannot produce the not-connected outcome. */
  project(
    evidence: Exclude<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>,
  ): Exclude<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_not_connected' }>;
  /** Union entry point retained for callers whose evidence has not been narrowed yet. */
  project(
    evidence: PhpSourceInvocationSemanticPipelineCompositionEvidence,
  ): PhpSourceInvocationSemanticPipelineIntegrationResult;
}
