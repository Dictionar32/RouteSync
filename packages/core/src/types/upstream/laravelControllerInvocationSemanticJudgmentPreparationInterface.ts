import type { PhpSourceDocument } from './phpSourceFrontendInterface';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { LaravelControllerInvocationSemanticJudgmentAuthorityInterface, LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import type { LaravelControllerSourceInventoryInterface } from './laravelControllerInvocationSemanticJudgmentInventoryInterface';
import type { PhpSourceInvocationSemanticPipelineInterface } from './phpSourceInvocationSemanticPipelineInterface';
import type { PhpSourceInvocationSemanticPipelineDeliveryInterface } from './phpSourceInvocationSemanticPipelineDeliveryInterface';

export interface LaravelControllerInvocationSemanticJudgmentPreparationEvidence {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_preparation_complete';
  readonly sourceInventory: LaravelControllerSourceInventoryInterface;
  readonly judgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[];
}

export interface LaravelControllerInvocationSemanticJudgmentPreparationHandlers<Result> {
  readonly onPrepared: (evidence: LaravelControllerInvocationSemanticJudgmentPreparationEvidence) => Result;
}

export interface LaravelControllerInvocationSemanticJudgmentPreparationJudgment extends LaravelControllerInvocationSemanticJudgmentPreparationEvidence {
  readonly continueWith: <Result>(handlers: LaravelControllerInvocationSemanticJudgmentPreparationHandlers<Result>) => Result;
}

export interface LaravelControllerInvocationSemanticJudgmentPreparationInput {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_preparation_input';
  readonly documents: readonly PhpSourceDocument[];
  readonly discoverySourceProject: SourceProjectIdentity;
  readonly requestedSourceProject: SourceProjectIdentity;
  /** Domain operation: continue this prepared-source input into invocation judgment preparation. */
  readonly continueToPreparation: (
    dependencies: LaravelControllerInvocationSemanticJudgmentPreparationDependencies,
  ) => LaravelControllerInvocationSemanticJudgmentPreparationJudgment;
}

export type LaravelControllerInvocationSemanticJudgmentPreparationInputData = Omit<
  LaravelControllerInvocationSemanticJudgmentPreparationInput,
  'continueToPreparation'
>

export interface LaravelControllerInvocationSemanticJudgmentPreparationInputFactoryInterface {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_preparation_input_factory';
  readonly create: (
    input: LaravelControllerInvocationSemanticJudgmentPreparationInputData,
  ) => LaravelControllerInvocationSemanticJudgmentPreparationInput;
}

export interface LaravelControllerInvocationSemanticJudgmentPreparationDependencies {
  readonly pipeline: Pick<PhpSourceInvocationSemanticPipelineInterface, 'analyze'>;
  readonly delivery: Pick<PhpSourceInvocationSemanticPipelineDeliveryInterface, 'deliver'>;
  readonly judgmentAuthority: Pick<LaravelControllerInvocationSemanticJudgmentAuthorityInterface, 'judge'>;
}

export interface LaravelControllerInvocationSemanticJudgmentPreparationFactoryInterface {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_preparation_factory';
  readonly prepare: (
    input: LaravelControllerInvocationSemanticJudgmentPreparationInput,
    dependencies: LaravelControllerInvocationSemanticJudgmentPreparationDependencies,
  ) => LaravelControllerInvocationSemanticJudgmentPreparationJudgment;
}
