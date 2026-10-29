import type {
  PhpSourceInvocationSemanticPipelineCompositionEvidence,
  PhpSourceInvocationSemanticPipelineComplete,
  PhpSourceInvocationSemanticPipelineBlocked,
} from './phpSourceInvocationSemanticPipelineInterface';
import type { PhpFunctionInvocationSemanticJudgmentBatchClosureResult } from './phpFunctionInvocationSemanticAuthorityInterface';
import type { PhpSourceInvocationSemanticSourceBindingJudgment } from './phpSourceInvocationSemanticSourceBindingInterface';
import type { SourceFile } from './names';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';

/**
 * Lossless payloads for PHP source-pipeline integration. Each outcome retains its
 * exact upstream evidence; the operational layer adds continuation without copying it.
 */
export type PhpSourceInvocationSemanticPipelineIntegrationNotConnectedPayload = Readonly<{
  readonly kind: 'php_source_invocation_integration_not_connected';
  readonly evidence: Extract<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>;
}>;

export type PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejectedPayload = Readonly<{
  readonly kind: 'php_source_invocation_integration_source_binding_rejected';
  readonly judgment: Extract<PhpSourceInvocationSemanticSourceBindingJudgment, { readonly kind: 'php_source_invocation_semantic_source_binding_rejected' }> ;
}>;

export type PhpSourceInvocationSemanticPipelineIntegrationCompletePayload = Readonly<{
  readonly kind: 'php_source_invocation_integration_complete';
  readonly sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment, { readonly kind: 'php_source_invocation_semantic_source_binding_closed' }>;
  readonly pipeline: PhpSourceInvocationSemanticPipelineComplete;
  readonly batch: Extract<PhpFunctionInvocationSemanticJudgmentBatchClosureResult, { readonly kind: 'php_function_invocation_semantic_judgment_batch_validated' }>;
}>;

export type PhpSourceInvocationSemanticPipelineIntegrationBlockedPayload = Readonly<{
  readonly kind: 'php_source_invocation_integration_blocked';
  readonly sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment, { readonly kind: 'php_source_invocation_semantic_source_binding_closed' }>;
  readonly pipeline: PhpSourceInvocationSemanticPipelineBlocked;
}>;

/** Outcome-specific operations preserve the response/ judgment correlation at the type level. */
export interface PhpSourceInvocationSemanticPipelineIntegrationNotConnectedOperations {
  readonly toControllerInvocationSemanticJudgment: (sourceFile: SourceFile) => Extract<
    LaravelControllerInvocationSemanticJudgmentInterface,
    { readonly response: PhpSourceInvocationSemanticPipelineIntegrationNotConnected }
  >;
}

export interface PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejectedOperations {
  readonly toControllerInvocationSemanticJudgment: (sourceFile: SourceFile) => Extract<
    LaravelControllerInvocationSemanticJudgmentInterface,
    { readonly response: PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejected }
  >;
}

export interface PhpSourceInvocationSemanticPipelineIntegrationCompleteOperations {
  readonly toControllerInvocationSemanticJudgment: (sourceFile: SourceFile) => Extract<
    LaravelControllerInvocationSemanticJudgmentInterface,
    { readonly response: PhpSourceInvocationSemanticPipelineIntegrationComplete }
  >;
}

export interface PhpSourceInvocationSemanticPipelineIntegrationBlockedOperations {
  readonly toControllerInvocationSemanticJudgment: (sourceFile: SourceFile) => Extract<
    LaravelControllerInvocationSemanticJudgmentInterface,
    { readonly response: PhpSourceInvocationSemanticPipelineIntegrationBlocked }
  >;
}

/** Each outcome exposes only the judgment operation that preserves its own semantic variant. */
export type PhpSourceInvocationSemanticPipelineIntegrationNotConnected = PhpSourceInvocationSemanticPipelineIntegrationNotConnectedPayload & PhpSourceInvocationSemanticPipelineIntegrationNotConnectedOperations;
export type PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejected = PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejectedPayload & PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejectedOperations;
export type PhpSourceInvocationSemanticPipelineIntegrationComplete = PhpSourceInvocationSemanticPipelineIntegrationCompletePayload & PhpSourceInvocationSemanticPipelineIntegrationCompleteOperations;
export type PhpSourceInvocationSemanticPipelineIntegrationBlocked = PhpSourceInvocationSemanticPipelineIntegrationBlockedPayload & PhpSourceInvocationSemanticPipelineIntegrationBlockedOperations;

/** Explicit outcome-specific constructors preserve the closed response correlation. */
export interface PhpSourceInvocationSemanticPipelineIntegrationJudgmentOperationsInterface {
  readonly kind: 'php_source_invocation_semantic_pipeline_integration_judgment_operations';
  readonly notConnected: (
    sourceFile: SourceFile,
    response: PhpSourceInvocationSemanticPipelineIntegrationNotConnected,
  ) => Extract<LaravelControllerInvocationSemanticJudgmentInterface, { readonly response: PhpSourceInvocationSemanticPipelineIntegrationNotConnected }>;
  readonly sourceBindingRejected: (
    sourceFile: SourceFile,
    response: PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejected,
  ) => Extract<LaravelControllerInvocationSemanticJudgmentInterface, { readonly response: PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejected }>;
  readonly complete: (
    sourceFile: SourceFile,
    response: PhpSourceInvocationSemanticPipelineIntegrationComplete,
  ) => Extract<LaravelControllerInvocationSemanticJudgmentInterface, { readonly response: PhpSourceInvocationSemanticPipelineIntegrationComplete }>;
  readonly blocked: (
    sourceFile: SourceFile,
    response: PhpSourceInvocationSemanticPipelineIntegrationBlocked,
  ) => Extract<LaravelControllerInvocationSemanticJudgmentInterface, { readonly response: PhpSourceInvocationSemanticPipelineIntegrationBlocked }>;
}

export type PhpSourceInvocationSemanticPipelineIntegrationResult =
  | PhpSourceInvocationSemanticPipelineIntegrationNotConnected
  | PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejected
  | PhpSourceInvocationSemanticPipelineIntegrationComplete
  | PhpSourceInvocationSemanticPipelineIntegrationBlocked;

/** Named domain constructors are consumed by upstream ADT operations; no generic visitor is required. */
export interface PhpSourceInvocationSemanticPipelineIntegrationOutcomeFactoryInterface {
  readonly kind: 'php_source_invocation_semantic_pipeline_integration_outcome_factory';
  readonly notConnected: (evidence: Extract<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>) => Extract<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_not_connected' }>;
  readonly sourceBindingRejected: (judgment: Extract<PhpSourceInvocationSemanticSourceBindingJudgment, { readonly kind: 'php_source_invocation_semantic_source_binding_rejected' }>) => Extract<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_source_binding_rejected' }>;
  readonly connected: (evidence: Extract<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_connected' }>) => Exclude<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_not_connected' | 'php_source_invocation_integration_source_binding_rejected' }>;
}

export interface PhpSourceInvocationSemanticPipelineIntegrationContract {
  readonly kind: 'php_source_invocation_semantic_pipeline_integration_contract';
  readonly version: 13;
  readonly scannerRequirement: 'production-controller-scanner-must-receive-an-authority-produced-whole-file-pipeline-result; method-body-only-ast-evidence-cannot-claim-source-pipeline-connection';
  readonly notConnectedSemantics: 'not-connected-is-a-distinct-non-success-outcome-and-never-an-empty-or-complete-invocation-batch';
  readonly sourceBindingSemantics: 'source-identity-rejection-is-a-distinct-non-success-outcome-and-never-reclassified-as-not-connected-or-blocked-pipeline';
  readonly rejectedEvidencePreservation: 'source-binding-rejection-retains-the-exact-rejected-pipeline-result-through-the-integrated-response';
  readonly deliverySemantics: 'source-bound-results-arrive-as-complete-delivery-entries-and-integration-does-not-perform-index-lookup';
  readonly sourceBindingPreservation: 'complete-and-blocked-outcomes-retain-the-exact-closed-source-binding-judgment-that-authorized-the-pipeline-result';
  readonly sourceIdentityJudgmentPreservation: 'every-source-binding-outcome-retains-the-typed-same-or-different-source-file-identity-judgment';
  readonly inputOutcomeClosure: 'not-connected-evidence-is-typed-to-not-connected-only;connected-or-source-binding-rejected-evidence-cannot-produce-not-connected';
  readonly terminalOperations: 'all-four-integrated-outcomes-own-toControllerInvocationSemanticJudgment-and-preserve-the-exact-source-binding-pipeline-or-rejection-evidence';
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
  version: 13,
  scannerRequirement: 'production-controller-scanner-must-receive-an-authority-produced-whole-file-pipeline-result; method-body-only-ast-evidence-cannot-claim-source-pipeline-connection',
  notConnectedSemantics: 'not-connected-is-a-distinct-non-success-outcome-and-never-an-empty-or-complete-invocation-batch',
  sourceBindingSemantics: 'source-identity-rejection-is-a-distinct-non-success-outcome-and-never-reclassified-as-not-connected-or-blocked-pipeline',
  rejectedEvidencePreservation: 'source-binding-rejection-retains-the-exact-rejected-pipeline-result-through-the-integrated-response',
  deliverySemantics: 'source-bound-results-arrive-as-complete-delivery-entries-and-integration-does-not-perform-index-lookup',
  sourceBindingPreservation: 'complete-and-blocked-outcomes-retain-the-exact-closed-source-binding-judgment-that-authorized-the-pipeline-result',
  sourceIdentityJudgmentPreservation: 'every-source-binding-outcome-retains-the-typed-same-or-different-source-file-identity-judgment',
  inputOutcomeClosure: 'not-connected-evidence-is-typed-to-not-connected-only;connected-or-source-binding-rejected-evidence-cannot-produce-not-connected',
  terminalOperations: 'all-four-integrated-outcomes-own-toControllerInvocationSemanticJudgment-and-preserve-the-exact-source-binding-pipeline-or-rejection-evidence',
  ruleOrder: Object.freeze([
    'preserve-not-connected-evidence-as-an-explicit-integrated-outcome',
    'preserve-source-binding-rejection-as-its-own-integrated-outcome',
    'consume-source-bound-pipeline-results-without-reconstructing-source-to-result-associations',
    'never-promote-not-connected-evidence-to-complete-or-empty-success',
    'publish-the-exact-authority-closed-batch-with-its-complete-pipeline-result-and-source-binding-judgment',
    'preserve-the-exact-blocked-pipeline-result-and-blocking-stage',
    'never-collapse-blocked-source-semantic-judgments-into-generic-pending-state',
    'never-reconstruct-or-upgrade-semantic-judgments-during-projection',
  ] as const),
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
