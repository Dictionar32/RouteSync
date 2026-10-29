import type { SourceFile } from './names';
import type { SourceFileIdentityRelationJudgment } from './sourceProjectIdentity';
import type { PhpSourceInvocationSemanticPipelineResult } from './phpSourceInvocationSemanticPipelineInterface';
import type {
  PhpSourceInvocationSemanticPipelineIntegrationInterface,
  PhpSourceInvocationSemanticPipelineIntegrationResult,
} from './phpSourceInvocationSemanticPipelineIntegrationInterface';
import type { PhpSourceInvocationSemanticSourceBindingAuthorityInterface } from './phpSourceInvocationSemanticSourceBindingInterface';
import type { LaravelControllerIntegratedResponseJudgment } from './laravelControllerResponseSemanticJudgmentInterface';

/** Domain-owned operations for interpreting each closed invocation input. */
export interface LaravelControllerInvocationSemanticInputDomainOperationsInterface {
  readonly judgePipelineNotProvided: (input: LaravelControllerInvocationPipelineNotProvidedInput) => LaravelControllerInvocationSemanticJudgmentInterface;
  readonly judgePipelineProvided: (input: LaravelControllerInvocationPipelineProvidedInput) => LaravelControllerInvocationSemanticJudgmentInterface;
}

/** Each input variant exposes the exact domain operation that can interpret it. */
export type LaravelControllerInvocationPipelineNotProvidedInput = Readonly<{
  readonly kind: 'controller_invocation_pipeline_not_provided';
  readonly sourceFile: SourceFile;
  readonly toControllerInvocationSemanticJudgment: (operations: LaravelControllerInvocationSemanticInputDomainOperationsInterface) => LaravelControllerInvocationSemanticJudgmentInterface;
}>;

export type LaravelControllerInvocationPipelineProvidedInput = Readonly<{
  readonly kind: 'controller_invocation_pipeline_provided';
  readonly sourceFile: SourceFile;
  readonly pipelineResult: PhpSourceInvocationSemanticPipelineResult;
  readonly toControllerInvocationSemanticJudgment: (operations: LaravelControllerInvocationSemanticInputDomainOperationsInterface) => LaravelControllerInvocationSemanticJudgmentInterface;
}>;

/** Closed, operational evidence supplied to the upstream judgment authority. */
export type LaravelControllerInvocationSemanticInput =
  | LaravelControllerInvocationPipelineNotProvidedInput
  | LaravelControllerInvocationPipelineProvidedInput;

export interface LaravelControllerInvocationSemanticInputFactoryInterface {
  readonly kind: 'laravel_controller_invocation_semantic_input_factory';
  readonly withoutPipeline: (sourceFile: SourceFile) => LaravelControllerInvocationPipelineNotProvidedInput;
  readonly withPipeline: (sourceFile: SourceFile, pipelineResult: PhpSourceInvocationSemanticPipelineResult) => LaravelControllerInvocationPipelineProvidedInput;
}

/** Common provenance shared by each closed invocation-judgment outcome. */
interface LaravelControllerInvocationSemanticJudgmentBase {
  readonly kind: 'laravel_controller_invocation_semantic_judgment';
  readonly contractVersion: 3;
  readonly sourceFile: SourceFile;
  /** Relates this judgment's canonical source identity to another source file. */
  readonly relateSourceFileIdentity: (candidate: SourceFile) => SourceFileIdentityRelationJudgment;
}

/**
 * The judgment is an outcome-indexed semantic value, not a callable runtime boundary.
 * Its integrated response is narrowed to one exact outcome so downstream code cannot
 * accidentally treat a rejected or blocked response as complete.
 */
export type LaravelControllerInvocationNotConnectedJudgment = LaravelControllerInvocationSemanticJudgmentBase & Readonly<{
  readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_not_connected' }>;
}>;

export type LaravelControllerInvocationSourceBindingRejectedJudgment = LaravelControllerInvocationSemanticJudgmentBase & Readonly<{
  readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_source_binding_rejected' }>;
}>;

export type LaravelControllerInvocationCompleteJudgment = LaravelControllerInvocationSemanticJudgmentBase & Readonly<{
  readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_complete' }>;
}>;

export type LaravelControllerInvocationBlockedJudgment = LaravelControllerInvocationSemanticJudgmentBase & Readonly<{
  readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult, { readonly kind: 'php_source_invocation_integration_blocked' }>;
}>;

/** Closed outcome ADT: each branch is a named judgment value, not a computed outcome-selection rule. */
export type LaravelControllerInvocationSemanticJudgmentInterface =
  | LaravelControllerInvocationNotConnectedJudgment
  | LaravelControllerInvocationSourceBindingRejectedJudgment
  | LaravelControllerInvocationCompleteJudgment
  | LaravelControllerInvocationBlockedJudgment;

/** Stable public name retained for callers that refer to the judgment as a type. */
export type LaravelControllerInvocationSemanticJudgment = LaravelControllerInvocationSemanticJudgmentInterface;

/** A supplied whole-file pipeline cannot yield the not-connected outcome. */
export type LaravelControllerInvocationProvidedPipelineJudgment = Exclude<
  LaravelControllerInvocationSemanticJudgmentInterface,
  LaravelControllerInvocationNotConnectedJudgment
>;

/**
 * Response projection is indexed by the exact invocation judgment already owned
 * by the controller artifact. The response ADT must be forwarded, not recomputed
 * by the AST projection authority.
 */
export type LaravelControllerAstProjectionResponseJudgment<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface,
> = LaravelControllerIntegratedResponseJudgment<InvocationJudgment>;

/** Parser projection input keeps syntax-only consumers separate from semantic execution. */
export type LaravelControllerAstProjectionContext<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> =
  | Readonly<{ readonly kind: 'syntax_only' }>
  | Readonly<{
      readonly kind: 'invocation_semantic_judgment';
      readonly judgment: InvocationJudgment;
    }>
  | Readonly<{
      readonly kind: 'integrated_invocation_response_judgment';
      readonly judgment: InvocationJudgment;
      readonly responseJudgment: LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>;
    }>;

/**
 * The response integration ADT is the sole owner of its outcome discriminants.
 * This alias exposes that existing discriminant set without restating semantic
 * outcomes in the invocation contract module.
 */
export type LaravelControllerInvocationIntegratedResponseOutcomeKind =
  PhpSourceInvocationSemanticPipelineIntegrationResult['kind'];

/**
 * Structural contract metadata only. Semantic rules and their executable values
 * belong to authorities; this interface module defines judgment shapes and correlations.
 */
export interface LaravelControllerInvocationSemanticJudgmentContract {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_contract';
  readonly version: 18;
  readonly judgmentShape: 'closed_discriminated_union';
  readonly authorityEntryPoint: 'each-input-variant-invokes-its-explicit-controller-judgment-domain-operation-and-publishes-the-closed-output-ADT';
  readonly sourceIdentity: 'canonical_source_file_on_judgment-with-judgment-owned-identity-relation-operation';
  readonly inputOutcomeRule: 'pipeline-not-provided-domain-operation-produces-not-connected;provided-pipeline-domain-operation-preserves-source-binding-rejected-complete-or-blocked-without-collapsing-distinct-outcomes';
  readonly responseCorrelation: 'integrated_response_indexed_by_exact_invocation_judgment';
}

/** Dependencies are explicit contracts; the authority never owns source binding or response projection rules. */
export interface LaravelControllerInvocationSemanticJudgmentAuthorityDependencies {
  readonly sourceBinding: PhpSourceInvocationSemanticSourceBindingAuthorityInterface;
  readonly integration: PhpSourceInvocationSemanticPipelineIntegrationInterface;
}

/** Callable execution is separated from the judgment value and its semantic contract. */
export interface LaravelControllerInvocationSemanticJudgmentAuthorityInterface extends LaravelControllerInvocationSemanticInputDomainOperationsInterface {
  readonly kind: 'laravel_controller_invocation_semantic_judgment_authority';
  readonly contract: LaravelControllerInvocationSemanticJudgmentContract;
  readonly dependencies: LaravelControllerInvocationSemanticJudgmentAuthorityDependencies;
  /** Single authority entry point: closed input ADT in, closed judgment ADT out. */
  judge(input: LaravelControllerInvocationSemanticInput): LaravelControllerInvocationSemanticJudgmentInterface;
}

/** Closed AST-projection decision: syntax-only and semantic projection are distinct ADT cases. */
export type LaravelControllerAstProjectionSemanticJudgment<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> =
  | Readonly<{
      readonly kind: 'syntax_only_projection';
      readonly sourceContextKind: 'syntax_only';
      readonly semanticDataflow: 'not-requested';
    }>
  | Readonly<{
      readonly kind: 'invocation_only_projection';
      readonly sourceContextKind: 'invocation_semantic_judgment';
      readonly invocationJudgment: InvocationJudgment;
      readonly semanticDataflow: 'consume-the-canonical-invocation-judgment-without-reclassification';
    }>
  | Readonly<{
      readonly kind: 'semantic_projection';
      readonly sourceContextKind: 'integrated_invocation_response_judgment';
      readonly invocationJudgment: InvocationJudgment;
      readonly responseJudgment: LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>;
      readonly semanticDataflow: 'consume-the-canonical-invocation-and-response-judgments-without-reclassification';
    }>;

/** AST projection is an executor contract over already-closed semantic input variants. */
export interface LaravelControllerAstProjectionSemanticAuthorityInterface {
  readonly kind: 'laravel_controller_ast_projection_semantic_authority';
  judge<InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>(
    context: LaravelControllerAstProjectionContext<InvocationJudgment>,
  ): LaravelControllerAstProjectionSemanticJudgment<InvocationJudgment>;
  readonly responsePreservation: 'ast-projection-forwards-the-artifact-owned-response-judgment-with-the-exact-correlated-invocation-judgment';
  readonly runtimeResponsibility: 'preserve-invocation-only-context-as-invocation-only-and-project-integrated-invocation-response-context-without-classification-or-reconstruction';
}

