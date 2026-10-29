import { phpSourceInvocationSemanticPipelineIntegrationAuthority } from './phpSourceInvocationSemanticPipelineIntegration';
import { phpSourceInvocationSemanticPipelineIntegrationOutcomeFactory } from './phpSourceInvocationSemanticPipelineIntegration';
import type { SourceFile } from './names';
import type { PhpSourceInvocationSemanticPipelineResult } from './phpSourceInvocationSemanticPipelineInterface';
import type { PhpSourceInvocationSemanticPipelineIntegrationInterface } from './phpSourceInvocationSemanticPipelineIntegrationInterface';
import { phpSourceInvocationSemanticSourceBindingAuthority, phpSourceInvocationPipelineEvidenceFromSourceBinding } from './phpSourceInvocationSemanticSourceBindingAuthority';
const notConnectedPipelineEvidence = (): Extract<import('./phpSourceInvocationSemanticPipelineInterface').PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }> => {
  type Evidence = Extract<import('./phpSourceInvocationSemanticPipelineInterface').PhpSourceInvocationSemanticPipelineCompositionEvidence, { readonly kind: 'php_source_invocation_pipeline_not_connected' }>;
  let evidence: Evidence;
  evidence = Object.freeze({
    kind: 'php_source_invocation_pipeline_not_connected',
    toControllerInvocationIntegrationResult: () => phpSourceInvocationSemanticPipelineIntegrationOutcomeFactory.notConnected(evidence),
  });
  return evidence;
};

import type {
  LaravelControllerInvocationSemanticInput,
  LaravelControllerInvocationSemanticInputFactoryInterface,
  LaravelControllerInvocationSemanticInputDomainOperationsInterface,
  LaravelControllerInvocationPipelineNotProvidedInput,
  LaravelControllerInvocationPipelineProvidedInput,
  LaravelControllerInvocationSemanticJudgment,
  LaravelControllerInvocationSemanticJudgmentAuthorityDependencies,
  LaravelControllerInvocationSemanticJudgmentAuthorityInterface,
  LaravelControllerInvocationSemanticJudgmentContract,
} from './laravelControllerInvocationSemanticJudgmentInterface';

/** Runtime contract metadata belongs to the authority implementation, not the type declaration module. */
export const LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT: LaravelControllerInvocationSemanticJudgmentContract = Object.freeze({
  kind: 'laravel_controller_invocation_semantic_judgment_contract',
  version: 18,
  judgmentShape: 'closed_discriminated_union',
  authorityEntryPoint: 'each-input-variant-invokes-its-explicit-controller-judgment-domain-operation-and-publishes-the-closed-output-ADT',
  sourceIdentity: 'canonical_source_file_on_judgment-with-judgment-owned-identity-relation-operation',
  inputOutcomeRule: 'pipeline-not-provided-domain-operation-produces-not-connected;provided-pipeline-domain-operation-preserves-source-binding-rejected-complete-or-blocked-without-collapsing-distinct-outcomes',
  responseCorrelation: 'integrated_response_indexed_by_exact_invocation_judgment',
});

/** Canonical constructors create input values that expose explicit domain operations. */
export const laravelControllerInvocationSemanticInputFactory: LaravelControllerInvocationSemanticInputFactoryInterface = Object.freeze({
  kind: 'laravel_controller_invocation_semantic_input_factory',
  withoutPipeline: (sourceFile: SourceFile) => {
    let input: LaravelControllerInvocationPipelineNotProvidedInput;
    input = Object.freeze({
      kind: 'controller_invocation_pipeline_not_provided',
      sourceFile,
      toControllerInvocationSemanticJudgment: (operations: LaravelControllerInvocationSemanticInputDomainOperationsInterface) => operations.judgePipelineNotProvided(input),
    });
    return input;
  },
  withPipeline: (sourceFile: SourceFile, pipelineResult: PhpSourceInvocationSemanticPipelineResult) => {
    let input: LaravelControllerInvocationPipelineProvidedInput;
    input = Object.freeze({
      kind: 'controller_invocation_pipeline_provided',
      sourceFile,
      pipelineResult,
      toControllerInvocationSemanticJudgment: (operations: LaravelControllerInvocationSemanticInputDomainOperationsInterface) => operations.judgePipelineProvided(input),
    });
    return input;
  },
});

/**
 * The invocation authority executes explicit input-domain operations.
 * The semantic rules are not injected or reconstructed by a generic handler.
 * Runtime operations compose the upstream binding and integration judgments.
 */
export class LaravelControllerInvocationSemanticJudgmentAuthority
  implements LaravelControllerInvocationSemanticJudgmentAuthorityInterface {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_authority' = 'laravel_controller_invocation_semantic_judgment_authority';
  readonly contract: LaravelControllerInvocationSemanticJudgmentContract = LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT;
  readonly dependencies: LaravelControllerInvocationSemanticJudgmentAuthorityDependencies;

  constructor(dependencies: LaravelControllerInvocationSemanticJudgmentAuthorityDependencies) {
    this.dependencies = Object.freeze(dependencies);
  }

  judge(input: LaravelControllerInvocationSemanticInput): LaravelControllerInvocationSemanticJudgment {
    return input.toControllerInvocationSemanticJudgment(this);
  }

  judgePipelineNotProvided(input: LaravelControllerInvocationPipelineNotProvidedInput): LaravelControllerInvocationSemanticJudgment {
    return this.judgmentFromResponse(
      input.sourceFile,
      this.dependencies.integration.project(notConnectedPipelineEvidence()),
    );
  }

  judgePipelineProvided(input: LaravelControllerInvocationPipelineProvidedInput): LaravelControllerInvocationSemanticJudgment {
    const binding = this.dependencies.sourceBinding.bind({
      controllerSourceFile: input.sourceFile,
      pipelineResult: input.pipelineResult,
    });
    return this.judgmentFromResponse(
      input.sourceFile,
      this.dependencies.integration.project(phpSourceInvocationPipelineEvidenceFromSourceBinding.project(binding)),
    );
  }

  private judgmentFromResponse(
    sourceFile: LaravelControllerInvocationSemanticInput['sourceFile'],
    response: import('./phpSourceInvocationSemanticPipelineIntegrationInterface').PhpSourceInvocationSemanticPipelineIntegrationResult,
  ): LaravelControllerInvocationSemanticJudgment {
    return response.toControllerInvocationSemanticJudgment(sourceFile);
  }
}

/** Concrete upstream dependencies are a single, typed composition value. */
const laravelControllerInvocationSemanticJudgmentAuthorityDependencies: LaravelControllerInvocationSemanticJudgmentAuthorityDependencies = Object.freeze({
  sourceBinding: phpSourceInvocationSemanticSourceBindingAuthority,
  integration: phpSourceInvocationSemanticPipelineIntegrationAuthority,
});

/** The executor retains the compatibility class while the public runtime boundary is an object. */
const laravelControllerInvocationSemanticJudgmentAuthorityExecutor = new LaravelControllerInvocationSemanticJudgmentAuthority(
  laravelControllerInvocationSemanticJudgmentAuthorityDependencies,
);

export const laravelControllerInvocationSemanticJudgmentAuthority: LaravelControllerInvocationSemanticJudgmentAuthorityInterface = Object.freeze({
  kind: 'laravel_controller_invocation_semantic_judgment_authority',
  contract: LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT,
  dependencies: laravelControllerInvocationSemanticJudgmentAuthorityDependencies,
  judge: (input: LaravelControllerInvocationSemanticInput): LaravelControllerInvocationSemanticJudgment => input.toControllerInvocationSemanticJudgment(laravelControllerInvocationSemanticJudgmentAuthorityExecutor),
  judgePipelineNotProvided: (input: LaravelControllerInvocationPipelineNotProvidedInput): LaravelControllerInvocationSemanticJudgment => laravelControllerInvocationSemanticJudgmentAuthorityExecutor.judgePipelineNotProvided(input),
  judgePipelineProvided: (input: LaravelControllerInvocationPipelineProvidedInput): LaravelControllerInvocationSemanticJudgment => laravelControllerInvocationSemanticJudgmentAuthorityExecutor.judgePipelineProvided(input),
});
