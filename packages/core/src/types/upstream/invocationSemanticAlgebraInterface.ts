/**
 * Legacy internal staged derivation contract retained as migration scaffolding.
 * Do not export this multi-operation surface as the public semantic algebra API;
 * callers must use InvocationSemanticAlgebraBoundaryInterface's single derive operation.
 */
import type {
  SemanticCallable,
  SemanticInvocation,
  SemanticKnowledgeDataFlow,
} from './semanticDataflowKnowledge';
import type {
  InvocationArgumentBindingJudgment,
  InvocationPositionalEvidenceInput,
  InvocationResultEmissionFlow,
  InvocationExceptionEmissionFlow,
  InvocationSemanticDerivationWitnesses,
  InvocationSemanticEvidence,
  InvocationSemanticInput,
  InvocationSemanticJudgment,
  InvocationSemanticRuleTraceEntry,
  InvocationTargetResolutionJudgment,
  SemanticInvocationObligation,
} from './invocationSemanticJudgmentInterface';

/** Evidence supplied by upstream for the invocation's ordered positional argument form. */
export type InvocationArgumentFormEvidence = InvocationPositionalEvidenceInput;

/** Input to the domain rule that resolves an invocation's callable target. */
export interface InvocationTargetResolutionAlgebraInput extends InvocationSemanticInput {
  readonly knowledge: SemanticKnowledgeDataFlow;
}

/**
 * Binding consumes a previously derived target judgment. It must not independently
 * rediscover or reclassify target candidates.
 */
export interface InvocationArgumentBindingAlgebraInput {
  readonly knowledge: SemanticKnowledgeDataFlow;
  readonly invocation: SemanticInvocation;
  readonly targetResolution: InvocationTargetResolutionJudgment;
  readonly positionalEvidence: InvocationArgumentFormEvidence;
}

/** A single effect-projection judgment retains both effect channels and their evidence. */
export type InvocationEffectProjectionJudgment =
  | Readonly<{
      readonly kind: 'effects-projected';
      readonly invocation: SemanticInvocation;
      readonly target: SemanticCallable;
      readonly resultFlows: readonly InvocationResultEmissionFlow[];
      readonly exceptionFlows: readonly InvocationExceptionEmissionFlow[];
      readonly evidence: InvocationSemanticEvidence;
      readonly obligations: readonly [];
    }>
  | Readonly<{
      readonly kind: 'effects-unavailable';
      readonly invocation: SemanticInvocation;
      readonly targetResolution: Extract<InvocationTargetResolutionJudgment, { readonly kind: 'unresolved' }>;
      readonly resultFlows: readonly [];
      readonly exceptionFlows: readonly [];
      readonly evidence: InvocationSemanticEvidence;
      readonly obligations: readonly [Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_unresolved' }>, ...Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_unresolved' }>[]];
    }>
  | Readonly<{
      readonly kind: 'effects-unavailable';
      readonly invocation: SemanticInvocation;
      readonly targetResolution: Extract<InvocationTargetResolutionJudgment, { readonly kind: 'ambiguous' }>;
      readonly resultFlows: readonly [];
      readonly exceptionFlows: readonly [];
      readonly evidence: InvocationSemanticEvidence;
      readonly obligations: readonly [Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_ambiguous' }>, ...Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_ambiguous' }>[]];
    }>;

/** Effect projection consumes target resolution rather than inferring it from raw knowledge. */
export interface InvocationEffectProjectionAlgebraInput {
  readonly knowledge: SemanticKnowledgeDataFlow;
  readonly invocation: SemanticInvocation;
  readonly targetResolution: InvocationTargetResolutionJudgment;
}

/**
 * Finalization receives the phase judgments and derivation artifacts. It may correlate
 * and close these domain results, but must not rerun target resolution, argument binding,
 * or effect classification from raw facts.
 */
export interface InvocationJudgmentClosureAlgebraInput {
  readonly invocation: SemanticInvocation;
  readonly targetResolution: InvocationTargetResolutionJudgment;
  readonly argumentBinding: InvocationArgumentBindingJudgment;
  readonly effectProjection: InvocationEffectProjectionJudgment;
  readonly obligations: readonly SemanticInvocationObligation[];
  readonly evidence: InvocationSemanticEvidence;
  readonly ruleTrace: readonly InvocationSemanticRuleTraceEntry[];
  readonly derivation: InvocationSemanticDerivationWitnesses;
}

/**
 * Internal implementation-stage interface only. The public domain boundary is
 * InvocationSemanticAlgebraBoundaryInterface; do not make callers orchestrate phases.
 */
export interface InvocationSemanticAlgebraInterface {
  readonly kind: 'invocation_semantic_algebra';
  readonly contract: InvocationSemanticAlgebraContract;
  readonly deriveTargetResolution: (
    input: InvocationTargetResolutionAlgebraInput,
  ) => InvocationTargetResolutionJudgment;
  readonly deriveArgumentBinding: (
    input: InvocationArgumentBindingAlgebraInput,
  ) => InvocationArgumentBindingJudgment;
  readonly deriveEffectProjection: (
    input: InvocationEffectProjectionAlgebraInput,
  ) => InvocationEffectProjectionJudgment;
  readonly closeJudgment: (
    input: InvocationJudgmentClosureAlgebraInput,
  ) => InvocationSemanticJudgment;
}

/** Static obligations of the algebra boundary, separate from the judgment result contract. */
export interface InvocationSemanticAlgebraContract {
  readonly kind: 'invocation_semantic_algebra_contract';
  readonly version: 1;
  readonly derivationOrder: readonly [
    'target-resolution',
    'argument-binding',
    'effect-projection',
    'judgment-closure',
  ];
  readonly targetResolutionAuthority: 'derive-candidates-from-upstream-semantic-knowledge';
  readonly bindingPrerequisite: 'consume-target-resolution-judgment-without-reclassification';
  readonly positionalPrerequisite: 'require-upstream-positional-evidence-before-positional-correspondence';
  readonly effectPrerequisite: 'consume-target-resolution-and-declared-callable-emissions';
  readonly effectChannelInvariant: 'result-and-exception-flows-remain-distinct';
  readonly closurePrerequisite: 'consume-phase-judgments-and-derivation-artifacts-without-rederiving-phases';
  readonly evidenceInvariant: 'preserve-upstream-source-evidence-for-every-derived-claim';
  readonly identityInvariant: 'authority-validates-cross-field-invocation-target-argument-and-evidence-identities';
  readonly closureInvariant: 'closed-only-when-no-unresolved-obligations-remain-and-proof-is-closed';
  readonly batchInvariant: 'batch-analysis-preserves-each-invocation-judgment-and-its-own-proof';
}

export const INVOCATION_SEMANTIC_ALGEBRA_CONTRACT: InvocationSemanticAlgebraContract = Object.freeze({
  kind: 'invocation_semantic_algebra_contract',
  version: 1,
  derivationOrder: Object.freeze([
    'target-resolution',
    'argument-binding',
    'effect-projection',
    'judgment-closure',
  ] as const),
  targetResolutionAuthority: 'derive-candidates-from-upstream-semantic-knowledge',
  bindingPrerequisite: 'consume-target-resolution-judgment-without-reclassification',
  positionalPrerequisite: 'require-upstream-positional-evidence-before-positional-correspondence',
  effectPrerequisite: 'consume-target-resolution-and-declared-callable-emissions',
  effectChannelInvariant: 'result-and-exception-flows-remain-distinct',
  closurePrerequisite: 'consume-phase-judgments-and-derivation-artifacts-without-rederiving-phases',
  evidenceInvariant: 'preserve-upstream-source-evidence-for-every-derived-claim',
  identityInvariant: 'authority-validates-cross-field-invocation-target-argument-and-evidence-identities',
  closureInvariant: 'closed-only-when-no-unresolved-obligations-remain-and-proof-is-closed',
  batchInvariant: 'batch-analysis-preserves-each-invocation-judgment-and-its-own-proof',
});

