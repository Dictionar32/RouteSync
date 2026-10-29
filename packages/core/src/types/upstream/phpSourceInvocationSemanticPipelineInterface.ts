import type { PhpFunctionResolutionEnvironmentProjectionResult } from './phpFunctionNameResolutionInterface';
import type { PhpFunctionNameResolutionJudgment } from './phpFunctionNameResolutionInterface';
import type { PhpFunctionResolutionSourceInventory } from './phpFunctionNameResolutionInterface';
import type {
  PhpFunctionInvocationSemanticJudgmentBatchClosureResult
} from './phpFunctionInvocationSemanticAuthorityInterface';
import type { PhpSourceDocument } from './phpSourceFrontendInterface';
import type {
  PhpSourceFrontendExtractionValidation,
} from './phpSourceFrontendValidationAuthorityInterface';
import type { PhpSourceInvocationSemanticSourceBindingJudgment } from './phpSourceInvocationSemanticSourceBindingInterface';

export type PhpSourceFrontendCompleteValidation = Extract<
  PhpSourceFrontendExtractionValidation,
  { readonly kind: 'php_source_frontend_extraction_validated' }
> & Readonly<{ readonly completeness: 'complete' }>;

export type PhpSourceFrontendIncompleteValidation = Extract<
  PhpSourceFrontendExtractionValidation,
  { readonly kind: 'php_source_frontend_extraction_validated' }
> & Readonly<{ readonly completeness: 'incomplete' }>;

export type PhpSourceInvocationSemanticPipelineCompletePayload = Readonly<{
  readonly kind: 'php_source_invocation_semantic_pipeline_complete';
  readonly document: PhpSourceDocument;
  readonly extraction: PhpSourceFrontendCompleteValidation;
  readonly inventory: Extract<PhpFunctionResolutionSourceInventory, { readonly kind: 'php_function_resolution_source_inventory_complete' }>;
  readonly resolutions: readonly PhpFunctionNameResolutionJudgment[];
  readonly batch: Extract<PhpFunctionInvocationSemanticJudgmentBatchClosureResult, { readonly kind: 'php_function_invocation_semantic_judgment_batch_validated' }>;
}>;

export type PhpSourceInvocationSemanticPipelineBlockedPayload =
  | Readonly<{
      readonly kind: 'php_source_invocation_semantic_pipeline_blocked';
      readonly stage: 'frontend_validation';
      readonly document: PhpSourceDocument;
      readonly validation: Extract<PhpSourceFrontendExtractionValidation, { readonly kind: 'php_source_frontend_extraction_rejected' }>;
    }>
  | Readonly<{
      readonly kind: 'php_source_invocation_semantic_pipeline_blocked';
      readonly stage: 'frontend_coverage';
      readonly document: PhpSourceDocument;
      readonly validation: PhpSourceFrontendIncompleteValidation;
    }>
  | Readonly<{
      readonly kind: 'php_source_invocation_semantic_pipeline_blocked';
      readonly stage: 'source_inventory';
      readonly document: PhpSourceDocument;
      readonly extraction: PhpSourceFrontendCompleteValidation;
      readonly inventory: Extract<PhpFunctionResolutionSourceInventory, { readonly kind: 'php_function_resolution_source_inventory_incomplete' }>;
    }>
  | Readonly<{
      readonly kind: 'php_source_invocation_semantic_pipeline_blocked';
      readonly stage: 'environment_projection';
      readonly document: PhpSourceDocument;
      readonly extraction: PhpSourceFrontendCompleteValidation;
      readonly inventory: Extract<PhpFunctionResolutionSourceInventory, { readonly kind: 'php_function_resolution_source_inventory_complete' }>;
      readonly projection: Extract<PhpFunctionResolutionEnvironmentProjectionResult, { readonly kind: 'php_function_resolution_environment_projection_incomplete' }>;
    }>
  | Readonly<{
      readonly kind: 'php_source_invocation_semantic_pipeline_blocked';
      readonly stage: 'invocation_batch_closure';
      readonly document: PhpSourceDocument;
      readonly extraction: PhpSourceFrontendCompleteValidation;
      readonly inventory: Extract<PhpFunctionResolutionSourceInventory, { readonly kind: 'php_function_resolution_source_inventory_complete' }>;
      readonly batch: Extract<PhpFunctionInvocationSemanticJudgmentBatchClosureResult, { readonly kind: 'php_function_invocation_semantic_judgment_batch_rejected' }>;
    }>;

/** The pipeline outcome owns its domain-specific transition into controller integration. */
export interface PhpSourceInvocationSemanticPipelineTerminalOperations {
  readonly integrateWithControllerSourceBinding: (
    sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment, { readonly kind: 'php_source_invocation_semantic_source_binding_closed' }>,
  ) => Exclude<
    import('./phpSourceInvocationSemanticPipelineIntegrationInterface').PhpSourceInvocationSemanticPipelineIntegrationResult,
    { readonly kind: 'php_source_invocation_integration_not_connected' | 'php_source_invocation_integration_source_binding_rejected' }
  >;
}

export type PhpSourceInvocationSemanticPipelineComplete = PhpSourceInvocationSemanticPipelineCompletePayload & PhpSourceInvocationSemanticPipelineTerminalOperations;
export type PhpSourceInvocationSemanticPipelineBlocked = PhpSourceInvocationSemanticPipelineBlockedPayload & PhpSourceInvocationSemanticPipelineTerminalOperations;
export type PhpSourceInvocationSemanticPipelineResult =
  | PhpSourceInvocationSemanticPipelineComplete
  | PhpSourceInvocationSemanticPipelineBlocked;


/** Explicit source-pipeline provenance carried into the single integrated response. */
export type PhpSourceInvocationSemanticPipelineNotConnectedPayload = Readonly<{
  readonly kind: 'php_source_invocation_pipeline_not_connected';
}>;
export type PhpSourceInvocationSemanticPipelineConnectedPayload = Readonly<{
  readonly kind: 'php_source_invocation_pipeline_connected';
  /** The binding judgment owns the exact pipeline result; no parallel result field can disagree. */
  readonly sourceBinding: Extract<PhpSourceInvocationSemanticSourceBindingJudgment, { readonly kind: 'php_source_invocation_semantic_source_binding_closed' }>;
}>;
export type PhpSourceInvocationSemanticPipelineSourceBindingRejectedPayload = Readonly<{
  readonly kind: 'php_source_invocation_pipeline_source_binding_rejected';
  readonly judgment: Extract<PhpSourceInvocationSemanticSourceBindingJudgment, { readonly kind: 'php_source_invocation_semantic_source_binding_rejected' }>;
}>;

/** Composition evidence owns the domain transition into the controller integration judgment. */
export interface PhpSourceInvocationSemanticPipelineCompositionEvidenceOperations {
  readonly toControllerInvocationIntegrationResult: () => import('./phpSourceInvocationSemanticPipelineIntegrationInterface').PhpSourceInvocationSemanticPipelineIntegrationResult;
}

/** Composition evidence is an operational ADT, not a tag-only DTO. */
export type PhpSourceInvocationSemanticPipelineNotConnected = PhpSourceInvocationSemanticPipelineNotConnectedPayload & PhpSourceInvocationSemanticPipelineCompositionEvidenceOperations;
export type PhpSourceInvocationSemanticPipelineConnected = PhpSourceInvocationSemanticPipelineConnectedPayload & PhpSourceInvocationSemanticPipelineCompositionEvidenceOperations;
export type PhpSourceInvocationSemanticPipelineSourceBindingRejected = PhpSourceInvocationSemanticPipelineSourceBindingRejectedPayload & PhpSourceInvocationSemanticPipelineCompositionEvidenceOperations;
export type PhpSourceInvocationSemanticPipelineCompositionEvidence =
  | PhpSourceInvocationSemanticPipelineNotConnected
  | PhpSourceInvocationSemanticPipelineConnected
  | PhpSourceInvocationSemanticPipelineSourceBindingRejected;


export interface PhpSourceInvocationSemanticPipelineContract {
  readonly kind: 'php_source_invocation_semantic_pipeline_contract';
  readonly version: 4;
  readonly inputBoundary: 'analyze-accepts-one-source-file-document-and-only-frontend-extraction-validation-may-establish-whole-file-coverage';
  readonly completionAuthority: 'only-complete-frontend-coverage-complete-source-inventory-complete-environment-projections-and-a-validated-invocation-batch-produce-a-complete-result';
  readonly scannerBoundary: 'scanner-consumes-the-typed-pipeline-result-and-must-not-recreate-name-resolution-or-invocation-closure';
  readonly stageOrder: readonly [
    'extract-whole-file-source-evidence-through-frontend-interface',
    'validate-extraction-provenance-and-coverage',
    'validate-whole-file-namespace-import-and-declaration-inventory',
    'derive-name-resolution-judgments-from-source-bound-environments',
    'derive-and-close-total-invocation-judgment-batch',
    'publish-only-a-closed-batch-as-complete-source-semantic-result',
  ];
  readonly sourceOwnership: 'document-and-frontend-extraction-own-source-evidence-until-authorities-validate-it';
  readonly semanticOwnership: 'name-resolution-and-invocation-authorities-own-semantic-judgments-not-the-frontend-or-laravel-scanner';
  readonly completeness: 'a-complete-result-requires-complete-frontend-coverage-complete-source-inventory-and-validated-invocation-batch';
  readonly failure: 'every-stage-failure-remains-a-typed-blocked-result-and-cannot-be-promoted-to-complete';
  readonly integration: 'only-the-complete-result-may-be-adapted-to-a-successful-integrated-response';
  readonly terminalOperations: 'complete-and-blocked-results-own-integrateWithControllerSourceBinding-and-preserve-the-exact-stage-payload';
  readonly compositionEvidenceOperations: 'connected-not-connected-and-source-binding-rejected-evidence-own-toControllerInvocationIntegrationResult';
}

export const PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_CONTRACT: PhpSourceInvocationSemanticPipelineContract = Object.freeze({
  kind: 'php_source_invocation_semantic_pipeline_contract',
  version: 4,
  inputBoundary: 'analyze-accepts-one-source-file-document-and-only-frontend-extraction-validation-may-establish-whole-file-coverage',
  completionAuthority: 'only-complete-frontend-coverage-complete-source-inventory-complete-environment-projections-and-a-validated-invocation-batch-produce-a-complete-result',
  scannerBoundary: 'scanner-consumes-the-typed-pipeline-result-and-must-not-recreate-name-resolution-or-invocation-closure',
  stageOrder: Object.freeze([
    'extract-whole-file-source-evidence-through-frontend-interface',
    'validate-extraction-provenance-and-coverage',
    'validate-whole-file-namespace-import-and-declaration-inventory',
    'derive-name-resolution-judgments-from-source-bound-environments',
    'derive-and-close-total-invocation-judgment-batch',
    'publish-only-a-closed-batch-as-complete-source-semantic-result',
  ] as const),
  sourceOwnership: 'document-and-frontend-extraction-own-source-evidence-until-authorities-validate-it',
  semanticOwnership: 'name-resolution-and-invocation-authorities-own-semantic-judgments-not-the-frontend-or-laravel-scanner',
  completeness: 'a-complete-result-requires-complete-frontend-coverage-complete-source-inventory-and-validated-invocation-batch',
  failure: 'every-stage-failure-remains-a-typed-blocked-result-and-cannot-be-promoted-to-complete',
  integration: 'only-the-complete-result-may-be-adapted-to-a-successful-integrated-response',
  terminalOperations: 'complete-and-blocked-results-own-integrateWithControllerSourceBinding-and-preserve-the-exact-stage-payload',
  compositionEvidenceOperations: 'connected-not-connected-and-source-binding-rejected-evidence-own-toControllerInvocationIntegrationResult',
});

/** Interface-first seam to connect the PHP source frontend to existing upstream authorities. */
export interface PhpSourceInvocationSemanticPipelineInterface {
  readonly kind: 'php_source_invocation_semantic_pipeline';
  readonly contract: PhpSourceInvocationSemanticPipelineContract;
  readonly analyze: (document: PhpSourceDocument) => PhpSourceInvocationSemanticPipelineResult;
}
