import { phpSourceInvocationSemanticPipelineIntegrationAuthority } from './phpSourceInvocationSemanticPipelineIntegration';
import type { PhpSourceInvocationSemanticPipelineIntegrationInterface } from './phpSourceInvocationSemanticPipelineIntegrationInterface';
import { phpSourceInvocationSemanticSourceBindingAuthority, phpSourceInvocationPipelineEvidenceFromSourceBinding } from './phpSourceInvocationSemanticSourceBindingAuthority';
import type {
  LaravelControllerInvocationSemanticInput,
  LaravelControllerInvocationSemanticJudgment,
  LaravelControllerInvocationSemanticJudgmentAuthorityDependencies,
  LaravelControllerInvocationSemanticJudgmentAuthorityInterface,
  LaravelControllerInvocationSemanticJudgmentContract,
} from './laravelControllerInvocationSemanticJudgmentInterface';

/** Runtime contract metadata belongs to the authority implementation, not the type declaration module. */
export const LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT: LaravelControllerInvocationSemanticJudgmentContract = Object.freeze({
  kind: 'laravel_controller_invocation_semantic_judgment_contract',
  version: 15,
  judgmentShape: 'closed_discriminated_union',
  authorityEntryPoint: 'one-judge-signature-accepts-the-closed-input-ADT-and-publishes-the-closed-output-ADT-without-overload-based-semantic-partitioning',
  sourceIdentity: 'canonical_source_file_on_judgment',
  inputOutcomeRule: 'pipeline-not-provided-can-only-produce-not-connected;provided-pipeline-outcomes-preserve-source-binding-rejected-complete-or-blocked-without-collapsing-distinct-outcomes',
  responseCorrelation: 'integrated_response_indexed_by_exact_invocation_judgment',
});

/**
 * Existing invocation authority executes the interface-owned contract.
 * The semantic rules are not injected or reconstructed by a factory.
 * Runtime methods only compose the upstream binding and integration judgments.
 */
export class LaravelControllerInvocationSemanticJudgmentAuthority
  implements LaravelControllerInvocationSemanticJudgmentAuthorityInterface {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_authority' = 'laravel_controller_invocation_semantic_judgment_authority';
  readonly contract = LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT;
  readonly dependencies: LaravelControllerInvocationSemanticJudgmentAuthorityDependencies;

  constructor(dependencies: LaravelControllerInvocationSemanticJudgmentAuthorityDependencies) {
    this.dependencies = Object.freeze(dependencies);
  }

  judge(input: LaravelControllerInvocationSemanticInput): LaravelControllerInvocationSemanticJudgment {
    switch (input.kind) {
      case 'controller_invocation_pipeline_not_provided':
        return this.judgmentFromResponse(input.sourceFile, this.dependencies.integration.project({
          kind: 'php_source_invocation_pipeline_not_connected',
        }));
      case 'controller_invocation_pipeline_provided': {
        const binding = this.dependencies.sourceBinding.bind({
          controllerSourceFile: input.sourceFile,
          pipelineResult: input.pipelineResult,
        });
        return this.judgmentFromResponse(
          input.sourceFile,
          this.dependencies.integration.project(phpSourceInvocationPipelineEvidenceFromSourceBinding(binding)),
        );
      }
    }
  }

  private judgmentFromResponse(
    sourceFile: LaravelControllerInvocationSemanticInput['sourceFile'],
    response: ReturnType<PhpSourceInvocationSemanticPipelineIntegrationInterface['project']>,
  ): LaravelControllerInvocationSemanticJudgment {
    switch (response.kind) {
      case 'php_source_invocation_integration_not_connected':
        return Object.freeze({ kind: 'laravel_controller_invocation_semantic_judgment', contractVersion: 2, sourceFile, response });
      case 'php_source_invocation_integration_source_binding_rejected':
        return Object.freeze({ kind: 'laravel_controller_invocation_semantic_judgment', contractVersion: 2, sourceFile, response });
      case 'php_source_invocation_integration_complete':
        return Object.freeze({ kind: 'laravel_controller_invocation_semantic_judgment', contractVersion: 2, sourceFile, response });
      case 'php_source_invocation_integration_blocked':
        return Object.freeze({ kind: 'laravel_controller_invocation_semantic_judgment', contractVersion: 2, sourceFile, response });
    }
  }
}

/** Composition root selects concrete upstream authorities for the closed judgment executor. */
export const laravelControllerInvocationSemanticJudgmentAuthority = new LaravelControllerInvocationSemanticJudgmentAuthority(
  {
    sourceBinding: phpSourceInvocationSemanticSourceBindingAuthority,
    integration: phpSourceInvocationSemanticPipelineIntegrationAuthority,
  },
);
