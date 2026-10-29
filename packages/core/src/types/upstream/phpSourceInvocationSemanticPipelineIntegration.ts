import type { PhpSourceInvocationSemanticPipelineCompositionEvidence } from './phpSourceInvocationSemanticPipelineInterface';
import type { PhpSourceInvocationSemanticSourceBindingJudgment } from './phpSourceInvocationSemanticSourceBindingInterface';
import type { SourceFile } from './names';
import { laravelSourceIdentitySemantics } from './sourceProjectIdentity';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import { PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_INTEGRATION_CONTRACT } from './phpSourceInvocationSemanticPipelineIntegrationInterface';
import type {
  PhpSourceInvocationSemanticPipelineIntegrationInterface,
  PhpSourceInvocationSemanticPipelineIntegrationResult,
  PhpSourceInvocationSemanticPipelineIntegrationNotConnected,
  PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejected,
  PhpSourceInvocationSemanticPipelineIntegrationComplete,
  PhpSourceInvocationSemanticPipelineIntegrationBlocked,
  PhpSourceInvocationSemanticPipelineIntegrationOutcomeFactoryInterface,
  PhpSourceInvocationSemanticPipelineIntegrationJudgmentOperationsInterface,
} from './phpSourceInvocationSemanticPipelineIntegrationInterface';

const notConnectedResult = (
  evidence: Extract<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>,
): PhpSourceInvocationSemanticPipelineIntegrationNotConnected => {
  let result: PhpSourceInvocationSemanticPipelineIntegrationNotConnected;
  result = Object.freeze({
    kind: 'php_source_invocation_integration_not_connected',
    evidence,
    toControllerInvocationSemanticJudgment: (sourceFile: SourceFile) => phpSourceInvocationSemanticPipelineIntegrationJudgmentOperations.notConnected(sourceFile, result),
  });
  return result;
};

const sourceBindingRejectedResult = (
  judgment: Extract<PhpSourceInvocationSemanticSourceBindingJudgment, { readonly kind: 'php_source_invocation_semantic_source_binding_rejected' }>,
): PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejected => {
  let result: PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejected;
  result = Object.freeze({
    kind: 'php_source_invocation_integration_source_binding_rejected',
    judgment,
    toControllerInvocationSemanticJudgment: (sourceFile: SourceFile) => phpSourceInvocationSemanticPipelineIntegrationJudgmentOperations.sourceBindingRejected(sourceFile, result),
  });
  return result;
};

function project(
  evidence: Extract<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>,
): Extract<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_not_connected' }>;
function project(
  evidence: Exclude<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>,
): Exclude<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_not_connected' }>;
function project(
  evidence: PhpSourceInvocationSemanticPipelineCompositionEvidence,
): PhpSourceInvocationSemanticPipelineIntegrationResult {
  return evidence.toControllerInvocationIntegrationResult();
}

/** Explicit integration-to-controller operation; the integrated response remains the exact source of truth. */
export const phpSourceInvocationSemanticPipelineIntegrationJudgmentOperations: PhpSourceInvocationSemanticPipelineIntegrationJudgmentOperationsInterface = Object.freeze({
  kind: 'php_source_invocation_semantic_pipeline_integration_judgment_operations',
  notConnected: (sourceFile: SourceFile, response: PhpSourceInvocationSemanticPipelineIntegrationNotConnected): Extract<LaravelControllerInvocationSemanticJudgmentInterface, { readonly response: PhpSourceInvocationSemanticPipelineIntegrationNotConnected }> => Object.freeze({
    kind: 'laravel_controller_invocation_semantic_judgment',
    contractVersion: 3,
    sourceFile,
    relateSourceFileIdentity: (candidate: SourceFile) => laravelSourceIdentitySemantics.relateSourceFiles(sourceFile, candidate),
    response,
  }),
  sourceBindingRejected: (sourceFile: SourceFile, response: PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejected): Extract<LaravelControllerInvocationSemanticJudgmentInterface, { readonly response: PhpSourceInvocationSemanticPipelineIntegrationSourceBindingRejected }> => Object.freeze({
    kind: 'laravel_controller_invocation_semantic_judgment',
    contractVersion: 3,
    sourceFile,
    relateSourceFileIdentity: (candidate: SourceFile) => laravelSourceIdentitySemantics.relateSourceFiles(sourceFile, candidate),
    response,
  }),
  complete: (sourceFile: SourceFile, response: PhpSourceInvocationSemanticPipelineIntegrationComplete): Extract<LaravelControllerInvocationSemanticJudgmentInterface, { readonly response: PhpSourceInvocationSemanticPipelineIntegrationComplete }> => Object.freeze({
    kind: 'laravel_controller_invocation_semantic_judgment',
    contractVersion: 3,
    sourceFile,
    relateSourceFileIdentity: (candidate: SourceFile) => laravelSourceIdentitySemantics.relateSourceFiles(sourceFile, candidate),
    response,
  }),
  blocked: (sourceFile: SourceFile, response: PhpSourceInvocationSemanticPipelineIntegrationBlocked): Extract<LaravelControllerInvocationSemanticJudgmentInterface, { readonly response: PhpSourceInvocationSemanticPipelineIntegrationBlocked }> => Object.freeze({
    kind: 'laravel_controller_invocation_semantic_judgment',
    contractVersion: 3,
    sourceFile,
    relateSourceFileIdentity: (candidate: SourceFile) => laravelSourceIdentitySemantics.relateSourceFiles(sourceFile, candidate),
    response,
  }),
});

/** Typed domain constructors used by the source-binding and pipeline ADTs. */
export const phpSourceInvocationSemanticPipelineIntegrationOutcomeFactory: PhpSourceInvocationSemanticPipelineIntegrationOutcomeFactoryInterface = Object.freeze({
  kind: 'php_source_invocation_semantic_pipeline_integration_outcome_factory',
  notConnected: notConnectedResult,
  sourceBindingRejected: sourceBindingRejectedResult,
  connected: (evidence: Extract<PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_connected' }>): Exclude<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_not_connected' | 'php_source_invocation_integration_source_binding_rejected' }> =>
    evidence.sourceBinding.pipelineResult.integrateWithControllerSourceBinding(evidence.sourceBinding),
});

/** Interface-first authority delegates the decision to the evidence ADT. */
export const phpSourceInvocationSemanticPipelineIntegrationAuthority: PhpSourceInvocationSemanticPipelineIntegrationInterface = Object.freeze({
  kind: 'php_source_invocation_semantic_pipeline_integration',
  contract: PHP_SOURCE_INVOCATION_SEMANTIC_PIPELINE_INTEGRATION_CONTRACT,
  project,
});
