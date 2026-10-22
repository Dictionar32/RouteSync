import type {
  PhpSourceInvocationSemanticPipelineCompositionEvidence,
} from './phpSourceInvocationSemanticPipelineInterface';
import {
  PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_INTEGRATION_CONTRACT,
} from './phpSourceInvocationSemanticPipelineIntegrationInterface';
import type {
  PhpSourceInvocationSemanticPipelineIntegrationInterface,
  PhpSourceInvocationSemanticPipelineIntegrationResult,
} from './phpSourceInvocationSemanticPipelineIntegrationInterface';

const projectConnectedResult = (
  evidence: Extract<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_connected' }>,
): Exclude<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_not_connected' }> => {
  switch (evidence.sourceBinding.pipelineResult.kind) {
    case 'php_source_invocation_semantic_pipeline_complete':
      return Object.freeze({
        kind: 'php_source_invocation_integration_complete',
        sourceBinding: evidence.sourceBinding,
        pipeline: evidence.sourceBinding.pipelineResult,
        batch: evidence.sourceBinding.pipelineResult.batch,
      });
    case 'php_source_invocation_semantic_pipeline_blocked':
      return Object.freeze({
        kind: 'php_source_invocation_integration_blocked',
        sourceBinding: evidence.sourceBinding,
        pipeline: evidence.sourceBinding.pipelineResult,
      });
  }
};

function project(
  evidence: Extract<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>,
): Extract<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_not_connected' }>;
function project(
  evidence: Exclude<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>,
): Exclude<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_not_connected' }>;
function project(
  evidence: PhpSourceInvocationSemanticPipelineCompositionEvidence,
): PhpSourceInvocationSemanticPipelineIntegrationResult;
function project(
  evidence: PhpSourceInvocationSemanticPipelineCompositionEvidence,
): PhpSourceInvocationSemanticPipelineIntegrationResult {
  switch (evidence.kind) {
    case 'php_source_invocation_pipeline_not_connected':
      return Object.freeze({
        kind: 'php_source_invocation_integration_not_connected',
        evidence,
      });
    case 'php_source_invocation_pipeline_connected':
      return projectConnectedResult(evidence);
    case 'php_source_invocation_pipeline_source_binding_rejected':
      return Object.freeze({
        kind: 'php_source_invocation_integration_source_binding_rejected',
        judgment: evidence.judgment,
      });
  }
}

/** Operational authority for the upstream integration contract. */
export const phpSourceInvocationSemanticPipelineIntegrationAuthority: PhpSourceInvocationSemanticPipelineIntegrationInterface = Object.freeze({
  kind: 'php_source_invocation_semantic_pipeline_integration',
  contract: PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_INTEGRATION_CONTRACT,
  project,
});
