/**
 * Canonical invocation semantic judgment contract.
 * This module defines domain meaning and result invariants; it does not depend on scanner syntax or executor implementation.
 */
import type {
  KnowledgeId,
  SemanticCallable,
  SemanticEmission,
  SemanticInvocation,
  SemanticKnowledgeDataFlow,
  SemanticSource,
} from './semanticDataflowKnowledge';


/** Non-empty, source-backed evidence for a semantic claim. */
export type InvocationSemanticEvidence = readonly [SemanticSource, ...SemanticSource[]];

export interface SemanticCallTarget {
  readonly invocation: SemanticInvocation;
  readonly callable: SemanticCallable;
}

export interface SemanticArgumentParameterFlow {
  readonly invocation: SemanticInvocation;
  readonly callable: SemanticCallable;
  readonly argument: KnowledgeId;
  readonly parameter: KnowledgeId;
}

/**
 * Evidence that upstream normalized this exact invocation's argument sequence
 * to positional semantics. The sequence is included so the authority can verify
 * that the evidence covers the invocation being judged rather than a nearby call.
 */
export interface InvocationPositionalArgumentEvidence {
  readonly kind: 'invocation_positional_argument_evidence';
  readonly invocation: KnowledgeId;
  readonly normalizedArguments: readonly KnowledgeId[];
  readonly normalization: 'upstream-confirmed-positional-arguments';
  readonly source: SemanticSource;
}

/** Provenance is attached to the individual correspondence, not just the call. */
export interface InvocationArgumentCorrespondenceEvidence {
  readonly kind: 'invocation_argument_correspondence_evidence';
  readonly invocation: KnowledgeId;
  readonly target: KnowledgeId;
  readonly argument: KnowledgeId;
  readonly parameter: KnowledgeId;
  readonly argumentEvidence: InvocationSemanticEvidence;
  readonly parameterEvidence: InvocationSemanticEvidence;
  readonly correspondenceEvidence: InvocationSemanticEvidence;
  readonly basis: 'confirmed-positional-order';
}

export interface InvocationArgumentBindingClaim {
  readonly kind: 'bound-argument';
  readonly relation: SemanticArgumentParameterFlow;
  readonly evidence: InvocationArgumentCorrespondenceEvidence;
}

export interface InvocationUnboundArgument {
  readonly kind: 'unbound-argument';
  readonly argument: KnowledgeId;
  readonly obligation: Extract<SemanticInvocationObligation, { readonly kind: 'argument_parameter_unresolved' }>;
  readonly evidence: InvocationSemanticEvidence;
}

/**
 * The argument is retained even though no target exists to judge its parameter correspondence.
 * Target status and its typed obligation are one discriminated domain fact, so they cannot disagree.
 */
export type InvocationBindingUnavailableArgument =
  | Readonly<{
      readonly kind: 'binding-unavailable-argument';
      readonly argument: KnowledgeId;
      readonly targetStatus: 'unresolved';
      readonly obligation: Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_unresolved' }>;
      readonly evidence: InvocationSemanticEvidence;
    }>
  | Readonly<{
      readonly kind: 'binding-unavailable-argument';
      readonly argument: KnowledgeId;
      readonly targetStatus: 'ambiguous';
      readonly obligation: Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_ambiguous' }>;
      readonly evidence: InvocationSemanticEvidence;
    }>;

/** The argument is retained while its call-form semantics remain unproven. */
export interface InvocationArgumentFormUnprovenDisposition {
  readonly kind: 'argument-form-unproven';
  readonly argument: KnowledgeId;
  readonly obligation: Extract<SemanticInvocationObligation, { readonly kind: 'argument_form_unproven' }>;
  readonly evidence: InvocationSemanticEvidence;
}

/** Exactly one semantic disposition is retained for each invocation argument. */
export type InvocationArgumentDisposition =
  | InvocationArgumentBindingClaim
  | InvocationUnboundArgument
  | InvocationBindingUnavailableArgument
  | InvocationArgumentFormUnprovenDisposition;

/** An incomplete positional judgment contains only proven bindings and unresolved argument correspondences. */
export type InvocationIncompleteArgumentDisposition = InvocationArgumentBindingClaim | InvocationUnboundArgument;
export type InvocationIncompleteArgumentDispositions = readonly [InvocationIncompleteArgumentDisposition, ...InvocationIncompleteArgumentDisposition[]];

/** Target availability is correlated with candidate cardinality by construction. */
export type InvocationArgumentBindingUnavailableTarget =
  | Readonly<{
      readonly kind: 'unresolved';
      readonly candidates: readonly [];
      readonly obligation: Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_unresolved' }>;
    }>
  | Readonly<{
      readonly kind: 'ambiguous';
      readonly candidates: readonly [SemanticCallable, SemanticCallable, ...SemanticCallable[]];
      readonly obligation: Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_ambiguous' }>;
    }>;

/**
 * Closed domain outcomes for argument binding. `argumentDispositions` is the
 * sole per-argument ledger: bound and unbound arrays cannot drift apart because
 * they are no longer independently supplied. Authority still validates that
 * its ordered identities exactly cover invocation.arguments and that every
 * claim's invocation/target/evidence agree with the enclosing judgment.
 */
export type InvocationArgumentBindingJudgment =
  | Readonly<{
      readonly kind: 'not-required';
      readonly invocation: SemanticInvocation & { readonly arguments: readonly [] };
      readonly target: SemanticCallable;
      readonly argumentDispositions: readonly [];
      readonly positionalEvidence: Extract<InvocationPositionalEvidenceDisposition, { readonly kind: 'positional-evidence-not-required' }>;
      readonly evidence: InvocationSemanticEvidence;
    }>
  | Readonly<{
      readonly kind: 'established';
      readonly invocation: SemanticInvocation & { readonly arguments: readonly [KnowledgeId, ...KnowledgeId[]] };
      readonly target: SemanticCallable;
      readonly argumentDispositions: readonly [InvocationArgumentBindingClaim, ...InvocationArgumentBindingClaim[]];
      readonly positionalEvidence: Extract<InvocationPositionalEvidenceDisposition, { readonly kind: 'positional-evidence-established' }>;
      readonly evidence: InvocationSemanticEvidence;
    }>
  | Readonly<{
      readonly kind: 'incomplete';
      readonly invocation: SemanticInvocation & { readonly arguments: readonly [KnowledgeId, ...KnowledgeId[]] };
      readonly target: SemanticCallable;
      readonly argumentDispositions: InvocationIncompleteArgumentDispositions;
      readonly positionalEvidence: Extract<InvocationPositionalEvidenceDisposition, { readonly kind: 'positional-evidence-established' }>;
      readonly evidence: InvocationSemanticEvidence;
    }>
  | Readonly<{
      readonly kind: 'blocked';
      readonly invocation: SemanticInvocation;
      readonly target: Extract<InvocationArgumentBindingUnavailableTarget, { readonly kind: 'unresolved' }>;
      readonly argumentDispositions: readonly Extract<InvocationBindingUnavailableArgument, { readonly targetStatus: 'unresolved' }>[];
      readonly positionalEvidence: Extract<InvocationPositionalEvidenceDisposition, { readonly kind: 'positional-evidence-not-assessable' }> & { readonly targetStatus: 'unresolved' };
      readonly evidence: InvocationSemanticEvidence;
    }>
  | Readonly<{
      readonly kind: 'blocked';
      readonly invocation: SemanticInvocation;
      readonly target: Extract<InvocationArgumentBindingUnavailableTarget, { readonly kind: 'ambiguous' }>;
      readonly argumentDispositions: readonly Extract<InvocationBindingUnavailableArgument, { readonly targetStatus: 'ambiguous' }>[];
      readonly positionalEvidence: Extract<InvocationPositionalEvidenceDisposition, { readonly kind: 'positional-evidence-not-assessable' }> & { readonly targetStatus: 'ambiguous' };
      readonly evidence: InvocationSemanticEvidence;
    }>
  | Readonly<{
      readonly kind: 'argument-form-unproven';
      readonly invocation: SemanticInvocation & { readonly arguments: readonly [KnowledgeId, ...KnowledgeId[]] };
      readonly target: SemanticCallable;
      readonly argumentDispositions: readonly [InvocationArgumentFormUnprovenDisposition, ...InvocationArgumentFormUnprovenDisposition[]];
      readonly positionalEvidence: Extract<InvocationPositionalEvidenceDisposition, { readonly kind: 'positional-evidence-unproven' }>;
      readonly evidence: InvocationSemanticEvidence;
      readonly obligation: Extract<SemanticInvocationObligation, { readonly kind: 'argument_form_unproven' }>;
    }>;

/** Invocation-owned semantics for argument binding and its required evidence. */
export interface InvocationArgumentBindingSemantics {
  readonly kind: 'invocation_argument_binding_semantics';
  readonly targetPrerequisite: 'uniquely-resolved-callable';
  readonly argumentFormPrerequisite: 'explicit-upstream-positional-normalization-evidence';
  readonly correspondence: 'normalized-positional-argument-to-parameter-order';
  readonly unmatchedArgument: 'retain-argument-and-emit-obligation';
  readonly extraParameters: 'permitted';
  readonly outcomes: Readonly<{
    readonly noArguments: 'not-required';
    readonly everyArgumentBound: 'established';
    readonly unresolvedArguments: 'incomplete-with-per-argument-obligations';
    readonly targetUnavailable: 'blocked-with-cardinality-consistent-candidates';
    readonly positionalFormUnproven: 'no-binding-conclusion-and-retain-obligation';
  }>;
  readonly partialKnowledge: 'preserve-established-correspondences';
  readonly identityInvariant: 'every-binding-matches-enclosing-invocation-and-target';
  readonly coverageInvariant: 'single-ordered-disposition-per-invocation-argument-with-no-loss-or-duplication-in-every-outcome';
  readonly unavailableTargetInvariant: 'each-unavailable-argument-status-matches-its-typed-target-obligation-and-enclosing-target-outcome';
  readonly outcomeInvariant: 'established-has-only-bound-dispositions-and-incomplete-has-only-bound-or-unbound-dispositions-with-at-least-one-unbound';
  readonly provenanceInvariant: 'every-binding-evidence-component-and-every-disposition-retains-non-empty-claim-specific-source-evidence';
  readonly positionalEvidenceInvariant: 'normalization-evidence-identifies-the-exact-invocation-and-ordered-argument-sequence-and-is-required-only-for-positional-correspondence';
}

/**
 * A projected effect is a claim about one declared emission of one resolved
 * callable for one invocation. The three provenance channels are intentionally
 * separate so authority can validate each identity edge rather than accepting
 * a generic source list as proof of the whole projection.
 */
interface InvocationCallEmissionFlowBase {
  readonly invocation: SemanticInvocation;
  readonly callable: SemanticCallable;
  readonly target: KnowledgeId;
  readonly invocationEvidence: InvocationSemanticEvidence;
  readonly callableDeclarationEvidence: InvocationSemanticEvidence;
  readonly emissionDeclarationEvidence: InvocationSemanticEvidence;
  readonly projectionEvidence: InvocationSemanticEvidence;
}

/** Result and exception projection are distinct domain outcomes, not interchangeable flows. */
export type SemanticCallEmissionFlow =
  | Readonly<InvocationCallEmissionFlowBase & {
      readonly kind: 'result-emission-flow';
      readonly emission: Omit<SemanticEmission, 'definition'> & {
        readonly definition: { readonly code: 'result' };
      };
    }>
  | Readonly<InvocationCallEmissionFlowBase & {
      readonly kind: 'exception-emission-flow';
      readonly emission: Omit<SemanticEmission, 'definition'> & {
        readonly definition: { readonly code: 'exception' };
      };
    }>;

export type InvocationResultEmissionFlow = Extract<SemanticCallEmissionFlow, { readonly kind: 'result-emission-flow' }>;
export type InvocationExceptionEmissionFlow = Extract<SemanticCallEmissionFlow, { readonly kind: 'exception-emission-flow' }>


/** Evidence status is a domain judgment, never an overloaded null sentinel. */
export type InvocationPositionalEvidenceInput =
  | Readonly<{
      readonly kind: 'positional-evidence-established';
      readonly evidence: InvocationPositionalArgumentEvidence;
    }>
  | Readonly<{
      readonly kind: 'positional-evidence-unproven';
      readonly obligation: Extract<SemanticInvocationObligation, { readonly kind: 'argument_form_unproven' }>;
    }>;

/** Every binding outcome states why positional evidence is present, unnecessary, or unavailable. */
export type InvocationPositionalEvidenceDisposition =
  | InvocationPositionalEvidenceInput
  | Readonly<{ readonly kind: 'positional-evidence-not-required' }>
  | Readonly<{ readonly kind: 'positional-evidence-not-assessable'; readonly targetStatus: 'unresolved' | 'ambiguous' }>;

/** A typed obligation retained when invocation semantics cannot be fully closed. */
export type SemanticInvocationObligation =
  | Readonly<{
      readonly kind: 'callable_target_unresolved';
      readonly reason: 'no_resolved_callable_target';
      readonly invocation: SemanticInvocation;
    }>
  | Readonly<{
      readonly kind: 'callable_target_ambiguous';
      readonly reason: 'multiple_distinct_resolved_callable_targets';
      readonly invocation: SemanticInvocation;
      readonly candidateCallables: readonly [SemanticCallable, SemanticCallable, ...SemanticCallable[]];
    }>
  | Readonly<{
      readonly kind: 'invocation_evidence_missing';
      readonly reason: 'invocation_not_present_in_semantic_knowledge';
      readonly invocation: SemanticInvocation;
    }>
  | Readonly<{
      readonly kind: 'argument_form_unproven';
      readonly reason: 'ordered-identities-do-not-prove-positional-argument-semantics';
      readonly invocation: SemanticInvocation;
    }>
  | Readonly<{
      readonly kind: 'argument_parameter_unresolved';
      readonly reason: 'argument_without_parameter';
      readonly invocation: SemanticInvocation;
      readonly callable: SemanticCallable;
      readonly argument: KnowledgeId;
    }>;

/** Public domain-operation catalog plus the invocation closure policy. */
export type InvocationSemanticClosureRule = Readonly<{
  readonly kind: 'judgment-closure';
  readonly id: 'invocation-judgment-closure';
  readonly closedWhen: 'domain-evidence-complete-and-no-unresolved-obligations';
  readonly preserveProvenFacts: true;
  readonly partialEvidenceImpliesSemanticClosure: false;
}>;

export type InvocationSemanticRule = InvocationSemanticExecutionRule | InvocationSemanticClosureRule;

export type InvocationSemanticRuleId = InvocationSemanticRule['id'];

export type InvocationSemanticExecutionRuleId =
  | 'invocation-evidence-presence'
  | 'invocation-target-resolution'
  | 'invocation-target-ambiguity'
  | 'invocation-positional-argument-binding'
  | 'invocation-argument-form-evidence'
  | 'invocation-argument-parameter-unresolved'
  | 'invocation-result-emission'
  | 'invocation-exception-emission'
  | 'invocation-unresolved-target-obligation';

/** Domain-level semantic operation vocabulary, used for proof ownership and trace coverage. */
export type InvocationSemanticExecutionRule =
  | Readonly<{
      readonly kind: 'invocation-presence';
      readonly id: 'invocation-evidence-presence';
      readonly requiredEvidence: 'invocation-source-knowledge';
      readonly missingEvidence: 'retain-invocation-obligation';
    }>
  | Readonly<{
      readonly kind: 'target-resolution';
      readonly id: 'invocation-target-resolution';
      readonly targetEvidence: 'invocation-callable-data-flow';
      readonly targetQualification: 'callable-declaration-evidence';
      readonly successfulJudgment: 'resolved-call-target';
    }>
  | Readonly<{
      readonly kind: 'target-cardinality';
      readonly id: 'invocation-target-ambiguity';
      readonly identity: 'distinct-callable-identity';
      readonly cardinality: 'exactly-one-for-closure';
      readonly ambiguity: 'retain-all-candidates-and-mark-ambiguous';
    }>
  | Readonly<{
      readonly kind: 'argument-binding';
      readonly id: 'invocation-positional-argument-binding';
      readonly correspondence: 'argument-position-to-parameter-position';
      readonly unmatchedArgument: 'retain-and-emit-obligation';
    }>
  | Readonly<{
      readonly kind: 'argument-form-evidence';
      readonly id: 'invocation-argument-form-evidence';
      readonly requiredEvidence: 'explicit-upstream-positional-normalization';
      readonly missingEvidence: 'retain-argument-form-obligation-and-withhold-binding';
    }>
  | Readonly<{
      readonly kind: 'unmatched-argument';
      readonly id: 'invocation-argument-parameter-unresolved';
      readonly condition: 'argument-position-has-no-parameter';
      readonly outcome: 'argument-binding-obligation';
    }>
  | Readonly<{
      readonly kind: 'effect-projection';
      readonly id: 'invocation-result-emission' | 'invocation-exception-emission';
      readonly effect: 'result' | 'exception';
      readonly source: 'declared-emissions-of-resolved-callable';
      readonly unrelatedEffects: 'exclude';
    }>
  | Readonly<{
      readonly kind: 'target-completeness';
      readonly id: 'invocation-unresolved-target-obligation';
      readonly condition: 'invocation-present-without-resolved-target';
      readonly outcome: 'unresolved-target-obligation';
    }>;

export type InvocationSemanticEvidenceProjection =
  | 'invocation-source'
  | 'target-sources'
  | 'argument-binding-sources'
  | 'result-emission-sources'
  | 'exception-emission-sources'
  | 'complete-judgment-sources';

export type InvocationSemanticObligationKind = SemanticInvocationObligation['kind'];

export type InvocationSemanticObligationPolicy =
  | Readonly<{
      readonly kind: 'invocation_evidence_missing';
      readonly reason: 'invocation_not_present_in_semantic_knowledge';
      readonly ownerRule: 'invocation-evidence-presence';
      readonly projection: 'invocation';
    }>
  | Readonly<{
      readonly kind: 'callable_target_unresolved';
      readonly reason: 'no_resolved_callable_target';
      readonly ownerRule: 'invocation-unresolved-target-obligation';
      readonly projection: 'invocation';
    }>
  | Readonly<{
      readonly kind: 'callable_target_ambiguous';
      readonly reason: 'multiple_distinct_resolved_callable_targets';
      readonly ownerRule: 'invocation-target-ambiguity';
      readonly projection: 'candidate-callables';
    }>
  | Readonly<{
      readonly kind: 'argument_form_unproven';
      readonly reason: 'ordered-identities-do-not-prove-positional-argument-semantics';
      readonly ownerRule: 'invocation-argument-form-evidence';
      readonly projection: 'invocation';
    }>
  | Readonly<{
      readonly kind: 'argument_parameter_unresolved';
      readonly reason: 'argument_without_parameter';
      readonly ownerRule: 'invocation-argument-parameter-unresolved';
      readonly projection: 'argument-parameter';
    }>;

/**
 * Trace and obligation ownership are part of the domain contract. The algebra
 * projects this metadata and never invents rule semantics from rule identifiers.
 */
export interface InvocationSemanticRulePolicy {
  readonly ruleId: InvocationSemanticExecutionRuleId | 'invocation-judgment-closure';
  readonly evidence: readonly InvocationSemanticEvidenceProjection[];
  readonly obligations: readonly InvocationSemanticObligationKind[];
  readonly outcome: 'derive-or-obligate' | 'closure';
}

export interface InvocationSemanticRulePolicyResolutionOperationsInterface {
  readonly resolve: (ruleId: InvocationSemanticRulePolicy['ruleId']) => InvocationSemanticRulePolicy;
}

/** Interface-first semantic policy lookup; callers name the domain operation explicitly. */
export const invocationSemanticRulePolicy: InvocationSemanticRulePolicyResolutionOperationsInterface = Object.freeze({
  resolve: (ruleId: InvocationSemanticRulePolicy['ruleId']): InvocationSemanticRulePolicy => {
    const policy = INVOCATION_SEMANTIC_RULE_POLICIES.find(candidate => candidate.ruleId === ruleId);
    if (!policy) throw new Error(`Missing invocation semantic rule policy: ${ruleId}`);
    return policy;
  },
});

export const INVOCATION_SEMANTIC_EXECUTION_RULE_IDS: readonly InvocationSemanticExecutionRuleId[] = Object.freeze([
  'invocation-evidence-presence',
  'invocation-target-resolution',
  'invocation-target-ambiguity',
  'invocation-positional-argument-binding',
  'invocation-argument-form-evidence',
  'invocation-argument-parameter-unresolved',
  'invocation-result-emission',
  'invocation-exception-emission',
  'invocation-unresolved-target-obligation',
]);


/**
 * Closed semantic signatures: each rule states its domain question, admissible
 * evidence, positive meaning, non-conclusion, obligation ownership, and proof
 * witness. This is the semantic model; rule registries and trace policies are
 * projections of it rather than independent sources of meaning.
 */
export type InvocationSemanticRuleMeaningSignature =
  | Readonly<{
      readonly ruleId: 'invocation-evidence-presence';
      readonly question: 'is-the-requested-invocation-present-in-source-knowledge';
      readonly admissibleEvidence: 'requested-invocation-source-knowledge';
      readonly establishedMeaning: 'requested-invocation-identity-is-grounded';
      readonly nonConclusion: 'absence-does-not-prove-nonexistence-outside-the-supplied-knowledge';
      readonly obligation: 'invocation_evidence_missing';
      readonly witness: 'invocation-presence';
    }>
  | Readonly<{
      readonly ruleId: 'invocation-target-resolution';
      readonly question: 'which-evidence-backed-callable-targets-belong-to-the-requested-invocation';
      readonly admissibleEvidence: 'invocation-callable-data-flow-and-callable-declaration-evidence';
      readonly establishedMeaning: 'retain-the-complete-distinct-target-candidate-set';
      readonly nonConclusion: 'candidate-presence-alone-does-not-establish-unique-target-resolution';
      readonly obligation: 'callable_target_unresolved';
      readonly witness: 'target-resolution';
    }>
  | Readonly<{
      readonly ruleId: 'invocation-target-ambiguity';
      readonly question: 'does-target-identity-have-exactly-one-distinct-callable-candidate';
      readonly admissibleEvidence: 'identity-distinct-callable-candidates-and-their-source-evidence';
      readonly establishedMeaning: 'one-candidate-is-resolved-and-multiple-candidates-remain-ambiguous';
      readonly nonConclusion: 'multiple-candidates-must-not-be-collapsed-to-an-arbitrary-target';
      readonly obligation: 'callable_target_ambiguous';
      readonly witness: 'target-ambiguity';
    }>
  | Readonly<{
      readonly ruleId: 'invocation-positional-argument-binding';
      readonly question: 'which-invocation-arguments-correspond-to-target-parameters';
      readonly admissibleEvidence: 'unique-target-explicit-positional-normalization-and-argument-parameter-evidence';
      readonly establishedMeaning: 'retain-ordered-per-argument-correspondence-and-its-provenance';
      readonly nonConclusion: 'ordered-identities-without-positional-normalization-do-not-prove-positional-binding';
      readonly obligation: 'argument_parameter_unresolved';
      readonly witness: 'argument-binding';
    }>
  | Readonly<{
      readonly ruleId: 'invocation-argument-form-evidence';
      readonly question: 'is-positional-argument-semantics-explicitly-established-upstream';
      readonly admissibleEvidence: 'exact-invocation-and-exact-ordered-argument-normalization-evidence';
      readonly establishedMeaning: 'positional-correspondence-is-permitted-only-for-the-proven-argument-sequence';
      readonly nonConclusion: 'argument-order-alone-does-not-establish-call-form';
      readonly obligation: 'argument_form_unproven';
      readonly witness: 'none';
    }>
  | Readonly<{
      readonly ruleId: 'invocation-argument-parameter-unresolved';
      readonly question: 'does-a-proven-positional-argument-have-no-corresponding-parameter';
      readonly admissibleEvidence: 'argument-identity-parameter-set-and-correspondence-provenance';
      readonly establishedMeaning: 'retain-the-unmatched-argument-as-an-explicit-domain-fact';
      readonly nonConclusion: 'unmatched-argument-does-not-erase-other-proven-bindings';
      readonly obligation: 'argument_parameter_unresolved';
      readonly witness: 'unmatched-argument';
    }>
  | Readonly<{
      readonly ruleId: 'invocation-result-emission';
      readonly question: 'which-declared-result-emissions-belong-to-the-resolved-target';
      readonly admissibleEvidence: 'requested-invocation-unique-target-declared-result-emission-and-projection-provenance';
      readonly establishedMeaning: 'project-only-result-emissions-owned-by-the-resolved-target';
      readonly nonConclusion: 'unrelated-callable-effects-and-undeclared-results-are-excluded';
      readonly obligation: 'none';
      readonly witness: 'effect-projection-result';
    }>
  | Readonly<{
      readonly ruleId: 'invocation-exception-emission';
      readonly question: 'which-declared-exception-emissions-belong-to-the-resolved-target';
      readonly admissibleEvidence: 'requested-invocation-unique-target-declared-exception-emission-and-projection-provenance';
      readonly establishedMeaning: 'project-only-exception-emissions-owned-by-the-resolved-target';
      readonly nonConclusion: 'unrelated-callable-effects-and-undeclared-exceptions-are-excluded';
      readonly obligation: 'none';
      readonly witness: 'effect-projection-exception';
    }>
  | Readonly<{
      readonly ruleId: 'invocation-unresolved-target-obligation';
      readonly question: 'does-a-present-invocation-lack-a-uniquely-resolved-target';
      readonly admissibleEvidence: 'requested-invocation-presence-and-complete-target-resolution-evidence';
      readonly establishedMeaning: 'retain-target-unavailability-as-an-explicit-domain-obligation';
      readonly nonConclusion: 'target-unavailability-does-not-authorize-effect-projection-or-argument-binding';
      readonly obligation: 'callable_target_unresolved';
      readonly witness: 'unresolved-target';
    }>
  | Readonly<{
      readonly ruleId: 'invocation-judgment-closure';
      readonly question: 'are-all-applicable-rules-accounted-for-and-all-required-evidence-and-obligations-resolved';
      readonly admissibleEvidence: 'complete-rule-trace-domain-proof-and-obligation-set';
      readonly establishedMeaning: 'closed-judgment-only-when-proof-is-complete-and-no-obligations-remain';
      readonly nonConclusion: 'partial-evidence-or-a-successful-subrule-alone-does-not-close-the-judgment';
      readonly obligation: 'preserve-all-unresolved-domain-obligations';
      readonly witness: 'judgment-closure';
    }>;

export type InvocationSemanticRuleMeaningCatalog = {
  readonly [RuleId in InvocationSemanticRuleId]: Extract<InvocationSemanticRuleMeaningSignature, { readonly ruleId: RuleId }>;
};

/** Domain facts that a rule may establish; these are semantic outcomes, not runtime stages. */
export type InvocationSemanticEstablishedFact =
  | 'invocation-identity-grounded'
  | 'complete-distinct-target-candidate-set'
  | 'target-cardinality-established'
  | 'ordered-argument-correspondence-established'
  | 'argument-form-status-established'
  | 'unmatched-argument-retained'
  | 'declared-result-emissions-projected'
  | 'declared-exception-emissions-projected'
  | 'target-availability-established'
  | 'judgment-closure-established';

/** Preconditions are typed semantic prerequisites, not instructions for a scanner to infer. */
export type InvocationSemanticRulePrerequisite =
  | 'source-invocation-identity'
  | 'invocation-and-callable-source-evidence'
  | 'identity-distinct-target-candidate-set'
  | 'uniquely-resolved-target-and-proven-positional-form'
  | 'exact-invocation-positional-normalization-evidence'
  | 'proven-argument-and-parameter-correspondence-evidence'
  | 'uniquely-resolved-target-with-declared-result-emission'
  | 'uniquely-resolved-target-with-declared-exception-emission'
  | 'present-invocation-and-complete-target-resolution-evidence'
  | 'complete-rule-trace-proof-and-obligation-set';

/**
 * This relation elevates rule descriptions into a judgment model: each rule binds
 * its prerequisite to the domain fact it may establish and points back to the
 * canonical meaning, obligation, witness, and trace policy. It prevents the
 * authority contract from treating rule identifiers as sufficient semantics.
 */
export type InvocationSemanticRuleJudgmentRelationFor<RuleId extends InvocationSemanticRuleId> = Readonly<{
  readonly ruleId: RuleId;
  readonly prerequisite: InvocationSemanticRulePrerequisite;
  readonly establishedFact: InvocationSemanticEstablishedFact;
  readonly nonConclusion: InvocationSemanticRuleMeaningCatalog[RuleId]['nonConclusion'];
  readonly obligation: InvocationSemanticRuleMeaningCatalog[RuleId]['obligation'];
  readonly witness: InvocationSemanticRuleMeaningCatalog[RuleId]['witness'];
  readonly tracePolicyOwner: RuleId;
}>;

export type InvocationSemanticRuleJudgmentRelation = {
  [RuleId in InvocationSemanticRuleId]: InvocationSemanticRuleJudgmentRelationFor<RuleId>
}[InvocationSemanticRuleId];

export type InvocationSemanticRuleJudgmentRelationCatalog = {
  readonly [RuleId in InvocationSemanticRuleId]: InvocationSemanticRuleJudgmentRelationFor<RuleId>;
};

export const INVOCATION_SEMANTIC_RULE_JUDGMENT_RELATIONS: InvocationSemanticRuleJudgmentRelationCatalog = Object.freeze({
  'invocation-evidence-presence': Object.freeze({ ruleId: 'invocation-evidence-presence', prerequisite: 'source-invocation-identity', establishedFact: 'invocation-identity-grounded', nonConclusion: 'absence-does-not-prove-nonexistence-outside-the-supplied-knowledge', obligation: 'invocation_evidence_missing', witness: 'invocation-presence', tracePolicyOwner: 'invocation-evidence-presence' }),
  'invocation-target-resolution': Object.freeze({ ruleId: 'invocation-target-resolution', prerequisite: 'invocation-and-callable-source-evidence', establishedFact: 'complete-distinct-target-candidate-set', nonConclusion: 'candidate-presence-alone-does-not-establish-unique-target-resolution', obligation: 'callable_target_unresolved', witness: 'target-resolution', tracePolicyOwner: 'invocation-target-resolution' }),
  'invocation-target-ambiguity': Object.freeze({ ruleId: 'invocation-target-ambiguity', prerequisite: 'identity-distinct-target-candidate-set', establishedFact: 'target-cardinality-established', nonConclusion: 'multiple-candidates-must-not-be-collapsed-to-an-arbitrary-target', obligation: 'callable_target_ambiguous', witness: 'target-ambiguity', tracePolicyOwner: 'invocation-target-ambiguity' }),
  'invocation-positional-argument-binding': Object.freeze({ ruleId: 'invocation-positional-argument-binding', prerequisite: 'uniquely-resolved-target-and-proven-positional-form', establishedFact: 'ordered-argument-correspondence-established', nonConclusion: 'ordered-identities-without-positional-normalization-do-not-prove-positional-binding', obligation: 'argument_parameter_unresolved', witness: 'argument-binding', tracePolicyOwner: 'invocation-positional-argument-binding' }),
  'invocation-argument-form-evidence': Object.freeze({ ruleId: 'invocation-argument-form-evidence', prerequisite: 'exact-invocation-positional-normalization-evidence', establishedFact: 'argument-form-status-established', nonConclusion: 'argument-order-alone-does-not-establish-call-form', obligation: 'argument_form_unproven', witness: 'none', tracePolicyOwner: 'invocation-argument-form-evidence' }),
  'invocation-argument-parameter-unresolved': Object.freeze({ ruleId: 'invocation-argument-parameter-unresolved', prerequisite: 'proven-argument-and-parameter-correspondence-evidence', establishedFact: 'unmatched-argument-retained', nonConclusion: 'unmatched-argument-does-not-erase-other-proven-bindings', obligation: 'argument_parameter_unresolved', witness: 'unmatched-argument', tracePolicyOwner: 'invocation-argument-parameter-unresolved' }),
  'invocation-result-emission': Object.freeze({ ruleId: 'invocation-result-emission', prerequisite: 'uniquely-resolved-target-with-declared-result-emission', establishedFact: 'declared-result-emissions-projected', nonConclusion: 'unrelated-callable-effects-and-undeclared-results-are-excluded', obligation: 'none', witness: 'effect-projection-result', tracePolicyOwner: 'invocation-result-emission' }),
  'invocation-exception-emission': Object.freeze({ ruleId: 'invocation-exception-emission', prerequisite: 'uniquely-resolved-target-with-declared-exception-emission', establishedFact: 'declared-exception-emissions-projected', nonConclusion: 'unrelated-callable-effects-and-undeclared-exceptions-are-excluded', obligation: 'none', witness: 'effect-projection-exception', tracePolicyOwner: 'invocation-exception-emission' }),
  'invocation-unresolved-target-obligation': Object.freeze({ ruleId: 'invocation-unresolved-target-obligation', prerequisite: 'present-invocation-and-complete-target-resolution-evidence', establishedFact: 'target-availability-established', nonConclusion: 'target-unavailability-does-not-authorize-effect-projection-or-argument-binding', obligation: 'callable_target_unresolved', witness: 'unresolved-target', tracePolicyOwner: 'invocation-unresolved-target-obligation' }),
  'invocation-judgment-closure': Object.freeze({ ruleId: 'invocation-judgment-closure', prerequisite: 'complete-rule-trace-proof-and-obligation-set', establishedFact: 'judgment-closure-established', nonConclusion: 'partial-evidence-or-a-successful-subrule-alone-does-not-close-the-judgment', obligation: 'preserve-all-unresolved-domain-obligations', witness: 'judgment-closure', tracePolicyOwner: 'invocation-judgment-closure' }),
});

export const INVOCATION_SEMANTIC_RULE_MEANING_SIGNATURES: InvocationSemanticRuleMeaningCatalog = Object.freeze({
  'invocation-evidence-presence': Object.freeze({
    ruleId: 'invocation-evidence-presence',
    question: 'is-the-requested-invocation-present-in-source-knowledge',
    admissibleEvidence: 'requested-invocation-source-knowledge',
    establishedMeaning: 'requested-invocation-identity-is-grounded',
    nonConclusion: 'absence-does-not-prove-nonexistence-outside-the-supplied-knowledge',
    obligation: 'invocation_evidence_missing',
    witness: 'invocation-presence',
  }),
  'invocation-target-resolution': Object.freeze({
    ruleId: 'invocation-target-resolution',
    question: 'which-evidence-backed-callable-targets-belong-to-the-requested-invocation',
    admissibleEvidence: 'invocation-callable-data-flow-and-callable-declaration-evidence',
    establishedMeaning: 'retain-the-complete-distinct-target-candidate-set',
    nonConclusion: 'candidate-presence-alone-does-not-establish-unique-target-resolution',
    obligation: 'callable_target_unresolved',
    witness: 'target-resolution',
  }),
  'invocation-target-ambiguity': Object.freeze({
    ruleId: 'invocation-target-ambiguity',
    question: 'does-target-identity-have-exactly-one-distinct-callable-candidate',
    admissibleEvidence: 'identity-distinct-callable-candidates-and-their-source-evidence',
    establishedMeaning: 'one-candidate-is-resolved-and-multiple-candidates-remain-ambiguous',
    nonConclusion: 'multiple-candidates-must-not-be-collapsed-to-an-arbitrary-target',
    obligation: 'callable_target_ambiguous',
    witness: 'target-ambiguity',
  }),
  'invocation-positional-argument-binding': Object.freeze({
    ruleId: 'invocation-positional-argument-binding',
    question: 'which-invocation-arguments-correspond-to-target-parameters',
    admissibleEvidence: 'unique-target-explicit-positional-normalization-and-argument-parameter-evidence',
    establishedMeaning: 'retain-ordered-per-argument-correspondence-and-its-provenance',
    nonConclusion: 'ordered-identities-without-positional-normalization-do-not-prove-positional-binding',
    obligation: 'argument_parameter_unresolved',
    witness: 'argument-binding',
  }),
  'invocation-argument-form-evidence': Object.freeze({
    ruleId: 'invocation-argument-form-evidence',
    question: 'is-positional-argument-semantics-explicitly-established-upstream',
    admissibleEvidence: 'exact-invocation-and-exact-ordered-argument-normalization-evidence',
    establishedMeaning: 'positional-correspondence-is-permitted-only-for-the-proven-argument-sequence',
    nonConclusion: 'argument-order-alone-does-not-establish-call-form',
    obligation: 'argument_form_unproven',
    witness: 'none',
  }),
  'invocation-argument-parameter-unresolved': Object.freeze({
    ruleId: 'invocation-argument-parameter-unresolved',
    question: 'does-a-proven-positional-argument-have-no-corresponding-parameter',
    admissibleEvidence: 'argument-identity-parameter-set-and-correspondence-provenance',
    establishedMeaning: 'retain-the-unmatched-argument-as-an-explicit-domain-fact',
    nonConclusion: 'unmatched-argument-does-not-erase-other-proven-bindings',
    obligation: 'argument_parameter_unresolved',
    witness: 'unmatched-argument',
  }),
  'invocation-result-emission': Object.freeze({
    ruleId: 'invocation-result-emission',
    question: 'which-declared-result-emissions-belong-to-the-resolved-target',
    admissibleEvidence: 'requested-invocation-unique-target-declared-result-emission-and-projection-provenance',
    establishedMeaning: 'project-only-result-emissions-owned-by-the-resolved-target',
    nonConclusion: 'unrelated-callable-effects-and-undeclared-results-are-excluded',
    obligation: 'none',
    witness: 'effect-projection-result',
  }),
  'invocation-exception-emission': Object.freeze({
    ruleId: 'invocation-exception-emission',
    question: 'which-declared-exception-emissions-belong-to-the-resolved-target',
    admissibleEvidence: 'requested-invocation-unique-target-declared-exception-emission-and-projection-provenance',
    establishedMeaning: 'project-only-exception-emissions-owned-by-the-resolved-target',
    nonConclusion: 'unrelated-callable-effects-and-undeclared-exceptions-are-excluded',
    obligation: 'none',
    witness: 'effect-projection-exception',
  }),
  'invocation-unresolved-target-obligation': Object.freeze({
    ruleId: 'invocation-unresolved-target-obligation',
    question: 'does-a-present-invocation-lack-a-uniquely-resolved-target',
    admissibleEvidence: 'requested-invocation-presence-and-complete-target-resolution-evidence',
    establishedMeaning: 'retain-target-unavailability-as-an-explicit-domain-obligation',
    nonConclusion: 'target-unavailability-does-not-authorize-effect-projection-or-argument-binding',
    obligation: 'callable_target_unresolved',
    witness: 'unresolved-target',
  }),
  'invocation-judgment-closure': Object.freeze({
    ruleId: 'invocation-judgment-closure',
    question: 'are-all-applicable-rules-accounted-for-and-all-required-evidence-and-obligations-resolved',
    admissibleEvidence: 'complete-rule-trace-domain-proof-and-obligation-set',
    establishedMeaning: 'closed-judgment-only-when-proof-is-complete-and-no-obligations-remain',
    nonConclusion: 'partial-evidence-or-a-successful-subrule-alone-does-not-close-the-judgment',
    obligation: 'preserve-all-unresolved-domain-obligations',
    witness: 'judgment-closure',
  }),
});
/**
 * Domain-level meaning of invocation resolution. These are semantic invariants,
 * not generic law kinds or relation-pattern instructions. Consumers can inspect
 * the complete invocation contract without interpreting a rule registry.
 */
export interface InvocationSemanticMeaningModel {
  readonly identity: Readonly<{
    readonly invocation: 'source-knowledge-identity';
    readonly target: 'evidence-backed-callable-identity';
    readonly targetEvidenceRole: 'callable';
    readonly targetCardinality: 'exactly-one-distinct-target-for-closure';
    readonly multipleTargets: 'retain-candidates-and-mark-ambiguous';
    readonly judgmentShape: 'resolved-single-target-or-unresolved-empty-candidates-or-ambiguous-multiple-candidates';
  }>;
  readonly argumentBinding: InvocationArgumentBindingSemantics;
  readonly effects: Readonly<{
    readonly resultKind: 'result';
    readonly exceptionKind: 'exception';
    readonly result: 'project-declared-result-emissions-of-resolved-targets';
    readonly exception: 'project-declared-exception-emissions-of-resolved-targets';
    readonly unrelatedCallableEffects: 'exclude';
  }>;
  readonly evidence: Readonly<{
    readonly target: 'invocation-callable-data-flow-and-callable-evidence';
    readonly emission: 'declared-emission-evidence';
    readonly provenance: 'preserve-source-witnesses';
    readonly unrelatedInvocationEvidence: 'exclude-before-derivation';
  }>;
  readonly closure: Readonly<{
    readonly closed: 'domain-evidence-complete-and-no-unresolved-obligations';
    readonly incomplete: 'preserve-all-proven-partial-facts';
    readonly partialEvidenceAlone: 'insufficient';
  }>;
}

/** Single source of truth for invocation-domain meaning, operation ownership, and closure policy. */
export const INVOCATION_SEMANTIC_MEANING: InvocationSemanticMeaningModel = Object.freeze({
  identity: Object.freeze({
    invocation: 'source-knowledge-identity',
    target: 'evidence-backed-callable-identity',
    targetEvidenceRole: 'callable',
    targetCardinality: 'exactly-one-distinct-target-for-closure',
    multipleTargets: 'retain-candidates-and-mark-ambiguous',
    judgmentShape: 'resolved-single-target-or-unresolved-empty-candidates-or-ambiguous-multiple-candidates',
  }),
  argumentBinding: Object.freeze({
    kind: 'invocation_argument_binding_semantics',
    targetPrerequisite: 'uniquely-resolved-callable',
    argumentFormPrerequisite: 'explicit-upstream-positional-normalization-evidence',
    correspondence: 'normalized-positional-argument-to-parameter-order',
    unmatchedArgument: 'retain-argument-and-emit-obligation',
    extraParameters: 'permitted',
    outcomes: Object.freeze({
      noArguments: 'not-required',
      everyArgumentBound: 'established',
      unresolvedArguments: 'incomplete-with-per-argument-obligations',
      targetUnavailable: 'blocked-with-cardinality-consistent-candidates',
      positionalFormUnproven: 'no-binding-conclusion-and-retain-obligation',
    }),
    partialKnowledge: 'preserve-established-correspondences',
    identityInvariant: 'every-binding-matches-enclosing-invocation-and-target',
    coverageInvariant: 'single-ordered-disposition-per-invocation-argument-with-no-loss-or-duplication-in-every-outcome',
    unavailableTargetInvariant: 'each-unavailable-argument-status-matches-its-typed-target-obligation-and-enclosing-target-outcome',
    outcomeInvariant: 'established-has-only-bound-dispositions-and-incomplete-has-only-bound-or-unbound-dispositions-with-at-least-one-unbound',
    provenanceInvariant: 'every-binding-evidence-component-and-every-disposition-retains-non-empty-claim-specific-source-evidence',
    positionalEvidenceInvariant: 'normalization-evidence-identifies-the-exact-invocation-and-ordered-argument-sequence-and-is-required-only-for-positional-correspondence',
  }),
  effects: Object.freeze({
    resultKind: 'result',
    exceptionKind: 'exception',
    result: 'project-declared-result-emissions-of-resolved-targets',
    exception: 'project-declared-exception-emissions-of-resolved-targets',
    unrelatedCallableEffects: 'exclude',
  }),
  evidence: Object.freeze({
    target: 'invocation-callable-data-flow-and-callable-evidence',
    emission: 'declared-emission-evidence',
    provenance: 'preserve-source-witnesses',
    unrelatedInvocationEvidence: 'exclude-before-derivation',
  }),
  closure: Object.freeze({
    closed: 'domain-evidence-complete-and-no-unresolved-obligations',
    incomplete: 'preserve-all-proven-partial-facts',
    partialEvidenceAlone: 'insufficient',
  }),
});

/** Invocation semantics are described in domain concepts, independently of execution strategy. */
export interface InvocationSemanticDerivationModel {
  readonly kind: 'invocation_semantic_derivation_model';
  readonly operations: readonly InvocationSemanticExecutionRule[];
}

const invocationDerivationOperations: readonly InvocationSemanticExecutionRule[] = Object.freeze([
  Object.freeze({
    kind: 'invocation-presence',
    id: 'invocation-evidence-presence',
    requiredEvidence: 'invocation-source-knowledge',
    missingEvidence: 'retain-invocation-obligation',
  }),
  Object.freeze({
    kind: 'target-resolution',
    id: 'invocation-target-resolution',
    targetEvidence: 'invocation-callable-data-flow',
    targetQualification: 'callable-declaration-evidence',
    successfulJudgment: 'resolved-call-target',
  }),
  Object.freeze({
    kind: 'target-cardinality',
    id: 'invocation-target-ambiguity',
    identity: 'distinct-callable-identity',
    cardinality: 'exactly-one-for-closure',
    ambiguity: 'retain-all-candidates-and-mark-ambiguous',
  }),
  Object.freeze({
    kind: 'argument-binding',
    id: 'invocation-positional-argument-binding',
    correspondence: 'argument-position-to-parameter-position',
    unmatchedArgument: 'retain-and-emit-obligation',
  }),
  Object.freeze({
    kind: 'argument-form-evidence',
    id: 'invocation-argument-form-evidence',
    requiredEvidence: 'explicit-upstream-positional-normalization',
    missingEvidence: 'retain-argument-form-obligation-and-withhold-binding',
  }),
  Object.freeze({
    kind: 'unmatched-argument',
    id: 'invocation-argument-parameter-unresolved',
    condition: 'argument-position-has-no-parameter',
    outcome: 'argument-binding-obligation',
  }),
  Object.freeze({
    kind: 'effect-projection',
    id: 'invocation-result-emission',
    effect: 'result',
    source: 'declared-emissions-of-resolved-callable',
    unrelatedEffects: 'exclude',
  }),
  Object.freeze({
    kind: 'effect-projection',
    id: 'invocation-exception-emission',
    effect: 'exception',
    source: 'declared-emissions-of-resolved-callable',
    unrelatedEffects: 'exclude',
  }),
  Object.freeze({
    kind: 'target-completeness',
    id: 'invocation-unresolved-target-obligation',
    condition: 'invocation-present-without-resolved-target',
    outcome: 'unresolved-target-obligation',
  }),
]);

export interface InvocationSemanticModel {
  readonly kind: 'invocation_semantic_model';
  readonly version: 20;
  readonly meaning: InvocationSemanticMeaningModel;
  /** Closed per-rule meaning signatures; all semantic questions and non-conclusions are explicit. */
  readonly ruleMeanings: InvocationSemanticRuleMeaningCatalog;
  /** Typed prerequisite-to-judgment-fact relations bind meaning to authority decisions. */
  readonly ruleJudgmentRelations: InvocationSemanticRuleJudgmentRelationCatalog;
  readonly argumentBinding: InvocationArgumentBindingSemantics;
  /** Domain derivation semantics; execution is direct and does not lower rule terms. */
  readonly judgment: InvocationSemanticDerivationModel;
  readonly obligations: Readonly<{
    readonly missingEvidence: Readonly<{
      readonly kind: 'invocation_evidence_missing';
      readonly reason: 'invocation_not_present_in_semantic_knowledge';
      readonly ownerRule: 'invocation-evidence-presence';
    }>;
    readonly unresolvedTarget: Readonly<{
      readonly kind: 'callable_target_unresolved';
      readonly reason: 'no_resolved_callable_target';
      readonly ownerRule: 'invocation-unresolved-target-obligation';
    }>;
    readonly ambiguousTarget: Readonly<{
      readonly kind: 'callable_target_ambiguous';
      readonly reason: 'multiple_distinct_resolved_callable_targets';
      readonly ownerRule: 'invocation-target-ambiguity';
    }>;
    readonly argumentFormUnproven: Readonly<{
      readonly kind: 'argument_form_unproven';
      readonly reason: 'ordered-identities-do-not-prove-positional-argument-semantics';
      readonly ownerRule: 'invocation-argument-form-evidence';
    }>;
    readonly unmatchedArgument: Readonly<{
      readonly kind: 'argument_parameter_unresolved';
      readonly reason: 'argument_without_parameter';
      readonly ownerRule: 'invocation-argument-parameter-unresolved';
    }>;
  }>;
  readonly trace: readonly InvocationSemanticRulePolicy[];
  readonly proof: Readonly<{
    readonly retainDomainEvidenceWitnesses: true;
    readonly retainArgumentBindingJudgment: true;
    readonly preserveProvenPartialFacts: true;
    readonly semanticClosureRequires: 'domain-evidence-complete-and-no-unresolved-obligations';
  }>;
}

const invocationTracePolicy = (policy: InvocationSemanticRulePolicy): InvocationSemanticRulePolicy => Object.freeze({
  ...policy,
  evidence: Object.freeze([...policy.evidence]),
  obligations: Object.freeze([...policy.obligations]),
});

/**
 * Authoritative invocation semantic model. Domain meaning and judgment invariants
 * are declared together; the domain algebra derives judgments directly from typed evidence.
 */
export const INVOCATION_SEMANTIC_MODEL: InvocationSemanticModel = Object.freeze({
  kind: 'invocation_semantic_model',
  version: 20,
  meaning: INVOCATION_SEMANTIC_MEANING,
  ruleMeanings: INVOCATION_SEMANTIC_RULE_MEANING_SIGNATURES,
  ruleJudgmentRelations: INVOCATION_SEMANTIC_RULE_JUDGMENT_RELATIONS,
  argumentBinding: INVOCATION_SEMANTIC_MEANING.argumentBinding,

  judgment: Object.freeze({
    kind: 'invocation_semantic_derivation_model',
    operations: invocationDerivationOperations,
  }),

  obligations: Object.freeze({
    missingEvidence: Object.freeze({ kind: 'invocation_evidence_missing', reason: 'invocation_not_present_in_semantic_knowledge', ownerRule: 'invocation-evidence-presence' }),
    unresolvedTarget: Object.freeze({ kind: 'callable_target_unresolved', reason: 'no_resolved_callable_target', ownerRule: 'invocation-unresolved-target-obligation' }),
    ambiguousTarget: Object.freeze({ kind: 'callable_target_ambiguous', reason: 'multiple_distinct_resolved_callable_targets', ownerRule: 'invocation-target-ambiguity' }),
    argumentFormUnproven: Object.freeze({ kind: 'argument_form_unproven', reason: 'ordered-identities-do-not-prove-positional-argument-semantics', ownerRule: 'invocation-argument-form-evidence' }),
    unmatchedArgument: Object.freeze({ kind: 'argument_parameter_unresolved', reason: 'argument_without_parameter', ownerRule: 'invocation-argument-parameter-unresolved' }),
  }),
  trace: Object.freeze([
    invocationTracePolicy({ ruleId: 'invocation-evidence-presence', evidence: ['invocation-source'], obligations: ['invocation_evidence_missing'], outcome: 'derive-or-obligate' }),
    invocationTracePolicy({ ruleId: 'invocation-target-resolution', evidence: ['invocation-source', 'target-sources'], obligations: [], outcome: 'derive-or-obligate' }),
    invocationTracePolicy({ ruleId: 'invocation-target-ambiguity', evidence: ['invocation-source', 'target-sources'], obligations: ['callable_target_ambiguous'], outcome: 'derive-or-obligate' }),
    invocationTracePolicy({ ruleId: 'invocation-positional-argument-binding', evidence: ['invocation-source', 'argument-binding-sources'], obligations: [], outcome: 'derive-or-obligate' }),
    invocationTracePolicy({ ruleId: 'invocation-argument-form-evidence', evidence: ['invocation-source'], obligations: ['argument_form_unproven'], outcome: 'derive-or-obligate' }),
    invocationTracePolicy({ ruleId: 'invocation-argument-parameter-unresolved', evidence: ['invocation-source', 'argument-binding-sources'], obligations: ['argument_parameter_unresolved'], outcome: 'derive-or-obligate' }),
    invocationTracePolicy({ ruleId: 'invocation-result-emission', evidence: ['invocation-source', 'result-emission-sources'], obligations: [], outcome: 'derive-or-obligate' }),
    invocationTracePolicy({ ruleId: 'invocation-exception-emission', evidence: ['invocation-source', 'exception-emission-sources'], obligations: [], outcome: 'derive-or-obligate' }),
    invocationTracePolicy({ ruleId: 'invocation-unresolved-target-obligation', evidence: ['invocation-source', 'target-sources'], obligations: ['callable_target_unresolved'], outcome: 'derive-or-obligate' }),
    invocationTracePolicy({ ruleId: 'invocation-judgment-closure', evidence: ['complete-judgment-sources'], obligations: ['invocation_evidence_missing', 'callable_target_unresolved', 'callable_target_ambiguous', 'argument_form_unproven', 'argument_parameter_unresolved'], outcome: 'closure' }),
  ]),
  proof: Object.freeze({
    retainDomainEvidenceWitnesses: true,
    retainArgumentBindingJudgment: true,
    preserveProvenPartialFacts: true,
    semanticClosureRequires: 'domain-evidence-complete-and-no-unresolved-obligations',
  }),
});

/** Trace policy is a projection of the high-level model, not a second hand-maintained catalog. */
export const INVOCATION_SEMANTIC_RULE_POLICIES: readonly InvocationSemanticRulePolicy[] = Object.freeze(
  INVOCATION_SEMANTIC_MODEL.trace.map(policy => Object.freeze({
    ...policy,
    evidence: Object.freeze([...policy.evidence]),
    obligations: Object.freeze([...policy.obligations]),
  })),
);

/** Executable domain rules are authored by the invocation semantic model itself. */
export const INVOCATION_SEMANTIC_EXECUTION_RULES: readonly InvocationSemanticExecutionRule[] =
  INVOCATION_SEMANTIC_MODEL.judgment.operations;

/** Domain obligation ownership; no relation-engine vocabulary crosses this interface. */
export const INVOCATION_SEMANTIC_OBLIGATION_POLICIES: readonly InvocationSemanticObligationPolicy[] = Object.freeze([
  Object.freeze({ ...INVOCATION_SEMANTIC_MODEL.obligations.missingEvidence, projection: 'invocation' }),
  Object.freeze({ ...INVOCATION_SEMANTIC_MODEL.obligations.unresolvedTarget, projection: 'invocation' }),
  Object.freeze({ ...INVOCATION_SEMANTIC_MODEL.obligations.ambiguousTarget, projection: 'candidate-callables' }),
  Object.freeze({ ...INVOCATION_SEMANTIC_MODEL.obligations.argumentFormUnproven, projection: 'invocation' }),
  Object.freeze({ ...INVOCATION_SEMANTIC_MODEL.obligations.unmatchedArgument, projection: 'argument-parameter' }),
]);

/**
 * Domain witnesses are semantic phase judgments, not one object per low-level
 * relation. Each witness points at the already-derived domain facts as a whole.
 */
export type InvocationSemanticDerivationWitness =
  | Readonly<{
      readonly kind: 'invocation-presence';
      readonly invocation: KnowledgeId;
      readonly evidence: readonly SemanticSource[];
    }>
  | Readonly<{
      readonly kind: 'target-resolution';
      readonly invocation: KnowledgeId;
      readonly targets: readonly SemanticCallTarget[];
      readonly outcome: 'resolved' | 'ambiguous' | 'unresolved';
      readonly evidence: readonly SemanticSource[];
    }>
  | Readonly<{
      readonly kind: 'target-ambiguity';
      readonly invocation: KnowledgeId;
      readonly candidates: readonly SemanticCallable[];
      readonly evidence: readonly SemanticSource[];
    }>
  | Readonly<{
      readonly kind: 'argument-binding';
      readonly judgment: InvocationArgumentBindingJudgment;
    }>
  | Readonly<{
      readonly kind: 'unmatched-argument';
      readonly invocation: KnowledgeId;
      readonly obligations: readonly Extract<SemanticInvocationObligation, { readonly kind: 'argument_parameter_unresolved' }>[];
      readonly evidence: readonly SemanticSource[];
    }>
  | Readonly<{
      readonly kind: 'effect-projection';
      readonly invocation: KnowledgeId;
      readonly flows: readonly SemanticCallEmissionFlow[];
      readonly effect: 'result' | 'exception';
      readonly evidence: readonly SemanticSource[];
    }>
  | Readonly<{
      readonly kind: 'unresolved-target';
      readonly invocation: KnowledgeId;
      readonly evidence: readonly SemanticSource[];
    }>
  | Readonly<{
      readonly kind: 'judgment-closure';
      readonly invocation: KnowledgeId;
      readonly status: 'closed' | 'incomplete';
      readonly evidence: readonly SemanticSource[];
    }>;

export interface InvocationSemanticWitnessOwnershipOperationsInterface {
  readonly ownerOf: (
    witness: InvocationSemanticDerivationWitness,
  ) => InvocationSemanticExecutionRuleId | 'invocation-judgment-closure';
}

/** Domain operation maps a typed derivation witness to its owning semantic rule. */
export const invocationSemanticWitnessOwnership: InvocationSemanticWitnessOwnershipOperationsInterface = Object.freeze({
  ownerOf: (
    witness: InvocationSemanticDerivationWitness,
  ): InvocationSemanticExecutionRuleId | 'invocation-judgment-closure' => {
    switch (witness.kind) {
      case 'invocation-presence': return 'invocation-evidence-presence';
      case 'target-resolution': return 'invocation-target-resolution';
      case 'target-ambiguity': return 'invocation-target-ambiguity';
      case 'argument-binding': return 'invocation-positional-argument-binding';
      case 'unmatched-argument': return 'invocation-argument-parameter-unresolved';
      case 'effect-projection': return witness.effect === 'result'
        ? 'invocation-result-emission'
        : 'invocation-exception-emission';
      case 'unresolved-target': return 'invocation-unresolved-target-obligation';
      case 'judgment-closure': return 'invocation-judgment-closure';
    }
  },
});

/**
 * Rule-to-witness ownership is encoded in the type, not left solely to a
 * runtime comparison. A trace entry cannot claim a witness owned by another
 * semantic rule. The argument-form evidence rule intentionally has no witness:
 * its semantic contribution is the typed obligation retained by the rule.
 */
export type InvocationSemanticTraceRuleId = InvocationSemanticExecutionRuleId | 'invocation-judgment-closure';

/**
 * Declarative rule contract. Each domain rule owns its allowed outcomes and
 * witness family directly; the type model contains no conditional rule dispatch.
 * These are semantic result shapes, not instructions for deriving a result.
 */
export interface InvocationSemanticTraceRuleContractCatalog {
  readonly 'invocation-evidence-presence': Readonly<{
    readonly outcomes: readonly ['derived', 'no-conclusion', 'obligation-emitted'];
    readonly witnesses: readonly Extract<InvocationSemanticDerivationWitness, { readonly kind: 'invocation-presence' }>[];
  }>;
  readonly 'invocation-target-resolution': Readonly<{
    readonly outcomes: readonly ['derived', 'no-conclusion', 'obligation-emitted'];
    readonly witnesses: readonly Extract<InvocationSemanticDerivationWitness, { readonly kind: 'target-resolution' }>[];
  }>;
  readonly 'invocation-target-ambiguity': Readonly<{
    readonly outcomes: readonly ['derived', 'no-conclusion', 'obligation-emitted'];
    readonly witnesses: readonly Extract<InvocationSemanticDerivationWitness, { readonly kind: 'target-ambiguity' }>[];
  }>;
  readonly 'invocation-positional-argument-binding': Readonly<{
    readonly outcomes: readonly ['derived', 'no-conclusion', 'obligation-emitted'];
    readonly witnesses: readonly Extract<InvocationSemanticDerivationWitness, { readonly kind: 'argument-binding' }>[];
  }>;
  readonly 'invocation-argument-form-evidence': Readonly<{
    readonly outcomes: readonly ['no-conclusion', 'obligation-emitted'];
    readonly witnesses: readonly never[];
  }>;
  readonly 'invocation-argument-parameter-unresolved': Readonly<{
    readonly outcomes: readonly ['derived', 'no-conclusion', 'obligation-emitted'];
    readonly witnesses: readonly Extract<InvocationSemanticDerivationWitness, { readonly kind: 'unmatched-argument' }>[];
  }>;
  readonly 'invocation-result-emission': Readonly<{
    readonly outcomes: readonly ['derived', 'no-conclusion', 'obligation-emitted'];
    readonly witnesses: readonly Extract<InvocationSemanticDerivationWitness, { readonly kind: 'effect-projection'; readonly effect: 'result' }>[];
  }>;
  readonly 'invocation-exception-emission': Readonly<{
    readonly outcomes: readonly ['derived', 'no-conclusion', 'obligation-emitted'];
    readonly witnesses: readonly Extract<InvocationSemanticDerivationWitness, { readonly kind: 'effect-projection'; readonly effect: 'exception' }>[];
  }>;
  readonly 'invocation-unresolved-target-obligation': Readonly<{
    readonly outcomes: readonly ['derived', 'no-conclusion', 'obligation-emitted'];
    readonly witnesses: readonly Extract<InvocationSemanticDerivationWitness, { readonly kind: 'unresolved-target' }>[];
  }>;
  readonly 'invocation-judgment-closure': Readonly<{
    readonly outcomes: readonly ['closed', 'incomplete'];
    readonly witnesses: readonly Extract<InvocationSemanticDerivationWitness, { readonly kind: 'judgment-closure' }>[];
  }>;
}

/** Outcome and witness types are projections of the declarative domain contract. */
export type InvocationSemanticTraceOutcomeFor<RuleId extends InvocationSemanticTraceRuleId> =
  InvocationSemanticTraceRuleContractCatalog[RuleId]['outcomes'][number];

type InvocationSemanticWitnessForRule<RuleId extends InvocationSemanticTraceRuleId> =
  InvocationSemanticTraceRuleContractCatalog[RuleId]['witnesses'][number];

type InvocationSemanticRuleTraceEntryFor<RuleId extends InvocationSemanticTraceRuleId> = Readonly<{
  readonly ruleId: RuleId;
  /** Knowledge identity this rule was evaluated for; counts alone are not a proof trace. */
  readonly subjectInvocation: KnowledgeId;
  /** Exact source provenance considered by this rule evaluation. */
  readonly evidence: readonly SemanticSource[];
  /** Exact domain obligations emitted by this rule evaluation. */
  readonly obligations: readonly SemanticInvocationObligation[];
  readonly outcome: InvocationSemanticTraceOutcomeFor<RuleId>;
  readonly derivedWitnessCount: number;
  readonly obligationCount: number;
  /** Concrete domain witnesses owned by this exact rule. */
  readonly witnesses: readonly InvocationSemanticWitnessForRule<RuleId>[];
}>;

export type InvocationSemanticRuleTraceEntry = {
  [RuleId in InvocationSemanticTraceRuleId]: InvocationSemanticRuleTraceEntryFor<RuleId>
}[InvocationSemanticTraceRuleId];

export interface InvocationSemanticContract {
  readonly kind: 'invocation_semantic_contract';
  readonly version: 37;
  /** Invocation-domain contract: the authority returns one validated judgment for the requested invocation. */
  readonly judgmentBoundary: Readonly<{
    readonly input: 'semantic-knowledge-and-requested-invocation';
    readonly output: 'validated-invocation-semantic-judgment';
    readonly proof: 'domain-judgment-and-phase-bound-evidence';
    readonly invalidJudgment: 'reject-before-downstream-projection';
  }>;
  readonly identity: Readonly<{
    readonly invocation: 'invocation-knowledge-identity';
    readonly callable: 'callable-knowledge-identity';
  }>;
  readonly model: InvocationSemanticModel;
  readonly argumentBinding: InvocationArgumentBindingSemantics;
  /** High-level invocation meaning consumed by authorities and downstream auditors. */
  readonly meaning: InvocationSemanticMeaningModel;
  readonly rules: readonly InvocationSemanticRule[];
  readonly executableRuleIds: readonly InvocationSemanticExecutionRuleId[];
  readonly rulePolicies: readonly InvocationSemanticRulePolicy[];
  readonly obligationPolicies: readonly InvocationSemanticObligationPolicy[];
  readonly input: Readonly<{
    readonly requestedInvocation: 'must-be-the-subject-of-every-judgment-and-trace-entry';
    readonly knowledgeMembership: 'authority-validates-exact-subject-shape-for-matching-identity-and-retains-missing-evidence-when-absent';
    readonly invocationShape: 'same-identity-requires-equal-receiver-operation-ordered-arguments-and-source-provenance';
    readonly absentInvocation: 'retain-missing-evidence-obligation-without-fabricating-membership';
    readonly foreignInvocationEvidence: 'reject-before-downstream-projection';
    readonly positionalArgumentEvidence: 'required-explicit-upstream-judgment-must-match-exact-invocation-and-ordered-arguments';
    readonly positionalEvidenceIdentity: 'reject-foreign-invocation-or-argument-sequence-before-semantic-derivation';
  }>;
  readonly execution: Readonly<{
    readonly scope: 'requested-invocation-and-semantic-dependencies';
    readonly unrelatedInvocations: 'excluded-before-domain-derivation';
    readonly dependencySlice: Readonly<{
      readonly targetEvidence: 'requested-invocation-callable-data-flow';
      readonly callableKnowledge: 'resolved-targets-only';
      readonly emissionKnowledge: 'declared-emissions-of-resolved-targets-only';
      readonly unrelatedEvidence: 'excluded-before-derivation';
    }>;
  }>;
  readonly effectProjection: Readonly<{
    readonly resultFlow: 'resolved-target-declared-result-emission-only';
    readonly exceptionFlow: 'resolved-target-declared-exception-emission-only';
    readonly invocationIdentity: 'same-requested-invocation-as-enclosing-judgment';
    readonly callableIdentity: 'same-uniquely-resolved-target-as-enclosing-judgment';
    readonly emissionMembership: 'emission-identity-must-belong-to-callable-declared-emissions';
    readonly provenance: 'separate-non-empty-invocation-callable-emission-and-projection-evidence';
    readonly unresolvedTarget: 'no-effect-projection';
  }>;
  readonly trace: Readonly<{
    readonly coverage: 'each-applicable-semantic-rule-has-one-subject-bound-trace-entry';
    readonly witnessOwnership: 'each-witness-kind-matches-its-owning-rule';
    readonly witnessSubject: 'every-witness-invocation-matches-trace-subject';
    readonly evidenceCoverage: 'trace-evidence-covers-each-derived-claim-and-obligation';
    readonly obligationOwnership: 'declaring-rule-plus-closure-summary';
    readonly closureObligations: 'complete-unresolved-obligation-set';
    readonly obligationCount: 'equals-obligation-witness-count';
    readonly outcomeCorrelation: 'closure-outcomes-belong-only-to-closure-rule-and-argument-form-evidence-never-claims-a-derivation-witness';
    readonly subjectIdentity: 'requested-invocation-knowledge-identity';
  }>;
  readonly judgment: Readonly<{
    readonly closureProof: 'closed-only-when-all-applicable-rules-are-accounted-for-and-no-obligations-remain';
    readonly incompleteProof: 'preserve-all-proven-facts-and-explicitly-retain-unresolved-obligations';
    readonly proofTraceCorrelation: 'proof-status-and-obligations-match-the-enclosing-judgment-and-rule-trace';
    readonly closedWhen: 'domain-evidence-complete-and-no-unresolved-obligations';
    readonly closedTargetResolution: 'resolved-only';
    readonly unavailableTargetBinding: 'unresolved-matches-blocked-unresolved-and-ambiguous-matches-blocked-ambiguous';
    readonly incompleteRetains: 'all-proven-partial-facts';
    readonly proofBinds: readonly ['invocation-identity', 'rule-specific-evidence', 'rule-outcomes', 'rule-specific-obligations', 'rule-obligation-ownership', 'trace-obligation-counts', 'domain-phase-evidence', 'target-resolution-outcome', 'argument-binding-judgment', 'argument-binding-identity', 'argument-disposition-coverage', 'claim-specific-provenance', 'effect-projection-identity', 'effect-projection-provenance', 'rule-trace-coverage', 'closure-completeness', 'semantic-judgment', 'unresolved-obligations'];
  }>;
}

/** Closure is a contract policy; all derivation laws are owned by INVOCATION_SEMANTIC_MODEL. */
export const INVOCATION_JUDGMENT_CLOSURE_RULE: InvocationSemanticClosureRule = Object.freeze({
  kind: 'judgment-closure',
  id: 'invocation-judgment-closure',
  closedWhen: 'domain-evidence-complete-and-no-unresolved-obligations',
  preserveProvenFacts: true,
  partialEvidenceImpliesSemanticClosure: false,
});

const invocationRuleById = <Id extends InvocationSemanticRuleId>(
  id: Id,
): Extract<InvocationSemanticRule, { readonly id: Id }> => {
  const rule = INVOCATION_SEMANTIC_MODEL.judgment.operations.find(candidate => candidate.id === id);
  if (rule) return rule as Extract<InvocationSemanticRule, { readonly id: Id }>;
  if (id === 'invocation-judgment-closure') return INVOCATION_JUDGMENT_CLOSURE_RULE as Extract<InvocationSemanticRule, { readonly id: Id }>;
  throw new Error(`Missing invocation semantic rule: ${id}`);
};

/** Compatibility names are projections of the authoritative model, never separate rule definitions. */
export const INVOCATION_EVIDENCE_PRESENCE_RULE = invocationRuleById('invocation-evidence-presence');
export const INVOCATION_TARGET_RESOLUTION_RULE = invocationRuleById('invocation-target-resolution');
export const INVOCATION_TARGET_AMBIGUITY_RULE = invocationRuleById('invocation-target-ambiguity');
export const INVOCATION_ARGUMENT_BINDING_RULE = invocationRuleById('invocation-positional-argument-binding');
export const INVOCATION_RESULT_EMISSION_RULE = invocationRuleById('invocation-result-emission');
export const INVOCATION_EXCEPTION_EMISSION_RULE = invocationRuleById('invocation-exception-emission');
export const INVOCATION_UNRESOLVED_TARGET_RULE = invocationRuleById('invocation-unresolved-target-obligation');

export const INVOCATION_SEMANTIC_RULES: readonly InvocationSemanticRule[] = Object.freeze([
  ...INVOCATION_SEMANTIC_MODEL.judgment.operations,
  INVOCATION_JUDGMENT_CLOSURE_RULE,
]);

const INVOCATION_PROOF_BINDINGS: readonly ['invocation-identity', 'rule-specific-evidence', 'rule-outcomes', 'rule-specific-obligations', 'rule-obligation-ownership', 'trace-obligation-counts', 'domain-phase-evidence', 'target-resolution-outcome', 'argument-binding-judgment', 'argument-binding-identity', 'argument-disposition-coverage', 'claim-specific-provenance', 'effect-projection-identity', 'effect-projection-provenance', 'rule-trace-coverage', 'closure-completeness', 'semantic-judgment', 'unresolved-obligations'] = Object.freeze([
  'invocation-identity',
  'rule-specific-evidence',
  'rule-outcomes',
  'rule-specific-obligations',
  'rule-obligation-ownership',
  'trace-obligation-counts',
  'domain-phase-evidence',
  'target-resolution-outcome',
  'argument-binding-judgment',
  'argument-binding-identity',
  'argument-disposition-coverage',
  'claim-specific-provenance',
  'effect-projection-identity',
  'effect-projection-provenance',
  'rule-trace-coverage',
  'closure-completeness',
  'semantic-judgment',
  'unresolved-obligations',
]);

export const INVOCATION_SEMANTIC_CONTRACT: InvocationSemanticContract = Object.freeze({
  kind: 'invocation_semantic_contract',
  version: 37,
  judgmentBoundary: Object.freeze({
    input: 'semantic-knowledge-and-requested-invocation',
    output: 'validated-invocation-semantic-judgment',
    proof: 'domain-judgment-and-phase-bound-evidence',
    invalidJudgment: 'reject-before-downstream-projection',
  }),
  identity: Object.freeze({
    invocation: 'invocation-knowledge-identity',
    callable: 'callable-knowledge-identity',
  }),
  model: INVOCATION_SEMANTIC_MODEL,
  argumentBinding: INVOCATION_SEMANTIC_MODEL.argumentBinding,
  meaning: INVOCATION_SEMANTIC_MODEL.meaning,
  rules: INVOCATION_SEMANTIC_RULES,
  executableRuleIds: INVOCATION_SEMANTIC_EXECUTION_RULE_IDS,
  rulePolicies: INVOCATION_SEMANTIC_RULE_POLICIES,
  obligationPolicies: INVOCATION_SEMANTIC_OBLIGATION_POLICIES,
  input: Object.freeze({
    requestedInvocation: 'must-be-the-subject-of-every-judgment-and-trace-entry',
    knowledgeMembership: 'authority-validates-exact-subject-shape-for-matching-identity-and-retains-missing-evidence-when-absent',
    invocationShape: 'same-identity-requires-equal-receiver-operation-ordered-arguments-and-source-provenance',
    absentInvocation: 'retain-missing-evidence-obligation-without-fabricating-membership',
    foreignInvocationEvidence: 'reject-before-downstream-projection',
    positionalArgumentEvidence: 'required-explicit-upstream-judgment-must-match-exact-invocation-and-ordered-arguments',
    positionalEvidenceIdentity: 'reject-foreign-invocation-or-argument-sequence-before-semantic-derivation',
  }),
  execution: Object.freeze({
    scope: 'requested-invocation-and-semantic-dependencies',
    unrelatedInvocations: 'excluded-before-domain-derivation',
    dependencySlice: Object.freeze({
      targetEvidence: 'requested-invocation-callable-data-flow',
      callableKnowledge: 'resolved-targets-only',
      emissionKnowledge: 'declared-emissions-of-resolved-targets-only',
      unrelatedEvidence: 'excluded-before-derivation',
    }),
  }),
  effectProjection: Object.freeze({
    resultFlow: 'resolved-target-declared-result-emission-only',
    exceptionFlow: 'resolved-target-declared-exception-emission-only',
    invocationIdentity: 'same-requested-invocation-as-enclosing-judgment',
    callableIdentity: 'same-uniquely-resolved-target-as-enclosing-judgment',
    emissionMembership: 'emission-identity-must-belong-to-callable-declared-emissions',
    provenance: 'separate-non-empty-invocation-callable-emission-and-projection-evidence',
    unresolvedTarget: 'no-effect-projection',
  }),
  trace: Object.freeze({
    coverage: 'each-applicable-semantic-rule-has-one-subject-bound-trace-entry',
    witnessOwnership: 'each-witness-kind-matches-its-owning-rule',
    witnessSubject: 'every-witness-invocation-matches-trace-subject',
    evidenceCoverage: 'trace-evidence-covers-each-derived-claim-and-obligation',
    obligationOwnership: 'declaring-rule-plus-closure-summary',
    closureObligations: 'complete-unresolved-obligation-set',
    obligationCount: 'equals-obligation-witness-count',
    outcomeCorrelation: 'closure-outcomes-belong-only-to-closure-rule-and-argument-form-evidence-never-claims-a-derivation-witness',
    subjectIdentity: 'requested-invocation-knowledge-identity',
  }),
  judgment: Object.freeze({
    closureProof: 'closed-only-when-all-applicable-rules-are-accounted-for-and-no-obligations-remain',
    incompleteProof: 'preserve-all-proven-facts-and-explicitly-retain-unresolved-obligations',
    proofTraceCorrelation: 'proof-status-and-obligations-match-the-enclosing-judgment-and-rule-trace',
    closedWhen: 'domain-evidence-complete-and-no-unresolved-obligations',
    closedTargetResolution: 'resolved-only',
    unavailableTargetBinding: 'unresolved-matches-blocked-unresolved-and-ambiguous-matches-blocked-ambiguous',
    incompleteRetains: 'all-proven-partial-facts',
    proofBinds: INVOCATION_PROOF_BINDINGS,
  }),
});

export const invocationSemanticRule = <K extends InvocationSemanticRule['kind']>(
  kind: K,
): Extract<InvocationSemanticRule, { readonly kind: K }> | undefined =>
  INVOCATION_SEMANTIC_CONTRACT.rules.find(
    (rule): rule is Extract<InvocationSemanticRule, { readonly kind: K }> => rule.kind === kind,
  );

export interface InvocationSemanticDerivationWitnesses {
  readonly kind: 'invocation_semantic_derivation';
  readonly status: 'closed' | 'incomplete';
  readonly witnesses: readonly InvocationSemanticDerivationWitness[];
}

export type InvocationSemanticProof =
  | Readonly<{
      readonly kind: 'invocation_semantic_proof';
      readonly status: 'closed';
      readonly closure: 'all-obligations-discharged';
      readonly evidence: readonly SemanticSource[];
      readonly ruleTrace: readonly InvocationSemanticRuleTraceEntry[];
      readonly unresolvedObligations: readonly [];
      readonly derivation: InvocationSemanticDerivationWitnesses;
    }>
  | Readonly<{
      readonly kind: 'invocation_semantic_proof';
      readonly status: 'incomplete';
      readonly closure: 'unresolved-obligations' | 'missing-invocation-evidence';
      readonly evidence: readonly SemanticSource[];
      readonly ruleTrace: readonly InvocationSemanticRuleTraceEntry[];
      readonly unresolvedObligations: readonly SemanticInvocationObligation[];
      readonly derivation: InvocationSemanticDerivationWitnesses;
    }>;

/**
 * Canonical target-resolution judgment. Candidate cardinality is represented by
 * the domain outcome itself rather than inferred by each consumer from an array.
 * The authority still validates that obligation invocation identity and evidence
 * match the enclosing requested invocation.
 */
export type InvocationTargetResolutionJudgment =
  | Readonly<{
      readonly kind: 'resolved';
      readonly invocation: SemanticInvocation;
      readonly target: SemanticCallable;
      readonly evidence: InvocationSemanticEvidence;
    }>
  | Readonly<{
      readonly kind: 'unresolved';
      readonly invocation: SemanticInvocation;
      readonly candidates: readonly [];
      readonly obligation: Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_unresolved' }>;
      readonly evidence: InvocationSemanticEvidence;
    }>
  | Readonly<{
      readonly kind: 'ambiguous';
      readonly invocation: SemanticInvocation;
      readonly candidates: readonly [SemanticCallable, SemanticCallable, ...SemanticCallable[]];
      readonly obligation: Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_ambiguous' }>;
      readonly evidence: InvocationSemanticEvidence;
    }>;

/**
 * A resolved target permits only argument-binding outcomes whose target is available.
 * This excludes `blocked`, whose domain meaning is that target resolution failed.
 */
export type InvocationResolvedTargetArgumentBindingJudgment = Extract<
  InvocationArgumentBindingJudgment,
  { readonly kind: 'not-required' | 'established' | 'incomplete' | 'argument-form-unproven' }
>;

/** Closed invocation judgments cannot carry unresolved or ambiguous target resolution. */
export type InvocationClosedSemanticJudgment = Readonly<{
  readonly kind: 'invocation_semantic_judgment';
  readonly status: 'closed';
  readonly invocation: SemanticInvocation;
  readonly targetResolution: Extract<InvocationTargetResolutionJudgment, { readonly kind: 'resolved' }>;
  readonly argumentBinding: Extract<InvocationArgumentBindingJudgment, { readonly kind: 'not-required' | 'established' }>;
  readonly resultFlows: readonly InvocationResultEmissionFlow[];
  readonly exceptionFlows: readonly InvocationExceptionEmissionFlow[];
  readonly unresolvedObligations: readonly [];
  readonly proof: Extract<InvocationSemanticProof, { readonly status: 'closed' }>;
}>;

/**
 * Incomplete judgments correlate unavailable target outcomes with the matching blocked
 * binding outcome. A resolved target may still have incomplete binding or other obligations.
 * Cross-field identity equality remains an authority invariant because TypeScript cannot
 * express equality between arbitrary `KnowledgeId` values in separate properties.
 */
export type InvocationIncompleteSemanticJudgment =
  | Readonly<{
      readonly kind: 'invocation_semantic_judgment';
      readonly status: 'incomplete';
      readonly invocation: SemanticInvocation;
      readonly targetResolution: Extract<InvocationTargetResolutionJudgment, { readonly kind: 'resolved' }>;
      readonly argumentBinding: InvocationResolvedTargetArgumentBindingJudgment;
      readonly resultFlows: readonly InvocationResultEmissionFlow[];
      readonly exceptionFlows: readonly InvocationExceptionEmissionFlow[];
      readonly unresolvedObligations: readonly SemanticInvocationObligation[];
      readonly proof: Extract<InvocationSemanticProof, { readonly status: 'incomplete' }>;
    }>
  | Readonly<{
      readonly kind: 'invocation_semantic_judgment';
      readonly status: 'incomplete';
      readonly invocation: SemanticInvocation;
      readonly targetResolution: Extract<InvocationTargetResolutionJudgment, { readonly kind: 'unresolved' }>;
      readonly argumentBinding: Extract<InvocationArgumentBindingJudgment, { readonly kind: 'blocked' }> & Readonly<{
        readonly target: Extract<InvocationArgumentBindingUnavailableTarget, { readonly kind: 'unresolved' }>;
      }>;
      readonly resultFlows: readonly InvocationResultEmissionFlow[];
      readonly exceptionFlows: readonly InvocationExceptionEmissionFlow[];
      readonly unresolvedObligations: readonly SemanticInvocationObligation[];
      readonly proof: Extract<InvocationSemanticProof, { readonly status: 'incomplete' }>;
    }>
  | Readonly<{
      readonly kind: 'invocation_semantic_judgment';
      readonly status: 'incomplete';
      readonly invocation: SemanticInvocation;
      readonly targetResolution: Extract<InvocationTargetResolutionJudgment, { readonly kind: 'ambiguous' }>;
      readonly argumentBinding: Extract<InvocationArgumentBindingJudgment, { readonly kind: 'blocked' }> & Readonly<{
        readonly target: Extract<InvocationArgumentBindingUnavailableTarget, { readonly kind: 'ambiguous' }>;
      }>;
      readonly resultFlows: readonly InvocationResultEmissionFlow[];
      readonly exceptionFlows: readonly InvocationExceptionEmissionFlow[];
      readonly unresolvedObligations: readonly SemanticInvocationObligation[];
      readonly proof: Extract<InvocationSemanticProof, { readonly status: 'incomplete' }>;
    }>;

export type InvocationSemanticJudgment =
  | InvocationClosedSemanticJudgment
  | InvocationIncompleteSemanticJudgment;

/** Aggregate analysis returned to callers; individual judgments remain independently inspectable. */
export type InvocationSemanticAnalysis =
  | Readonly<{
      readonly kind: 'invocation_semantic_analysis';
      readonly status: 'closed';
      readonly judgments: readonly Extract<InvocationSemanticJudgment, { readonly status: 'closed' }>[];
      readonly callTargets: readonly SemanticCallTarget[];
      readonly argumentBindings: readonly InvocationArgumentBindingJudgment[];
      readonly resultFlows: readonly InvocationResultEmissionFlow[];
      readonly exceptionFlows: readonly InvocationExceptionEmissionFlow[];
      readonly unresolvedObligations: readonly [];
      readonly proof: Extract<InvocationSemanticProof, { readonly status: 'closed' }>;
      readonly derivationProof: InvocationSemanticDerivationWitnesses;
    }>
  | Readonly<{
      readonly kind: 'invocation_semantic_analysis';
      readonly status: 'incomplete';
      readonly judgments: readonly InvocationSemanticJudgment[];
      readonly callTargets: readonly SemanticCallTarget[];
      readonly argumentBindings: readonly InvocationArgumentBindingJudgment[];
      readonly resultFlows: readonly InvocationResultEmissionFlow[];
      readonly exceptionFlows: readonly InvocationExceptionEmissionFlow[];
      readonly unresolvedObligations: readonly SemanticInvocationObligation[];
      readonly proof: Extract<InvocationSemanticProof, { readonly status: 'incomplete' }>;
      readonly derivationProof: InvocationSemanticDerivationWitnesses;
    }>;

/** Backward-compatible name; the canonical model is InvocationSemanticAnalysis/Judgment. */
export type SemanticInterproceduralDataFlow = InvocationSemanticAnalysis;

export interface InvocationSemanticInput {
  /** Complete typed semantic knowledge supplied by the upstream source-model stage. */
  readonly knowledge: SemanticKnowledgeDataFlow;
  /** The invocation whose semantic judgment is requested. */
  readonly invocation: SemanticInvocation;
  /** Required upstream disposition; authority rejects evidence whose invocation or ordered arguments differ from `invocation`. */
  readonly positionalEvidence: InvocationPositionalEvidenceInput;
}

/** Shared domain operations for validating invocation input and its resulting judgment. */
export interface InvocationSemanticContractOperationsInterface {
  readonly validateInput: (input: InvocationSemanticInput) => InvocationSemanticInput;
  readonly validateJudgment: (
    input: InvocationSemanticInput,
    judgment: InvocationSemanticJudgment,
  ) => InvocationSemanticJudgment;
}

export interface InvocationSemanticAuthorityInterface {
  readonly kind: 'invocation_semantic_authority';
  /** The exact semantic contract implemented by this authority. */
  readonly contract: InvocationSemanticContract;
  /**
   * Returns only a judgment validated for requested identity, evidence provenance,
   * proof/witness and rule-trace ownership, obligations, and closure correlation.
   * The returned proof trace is part of the judgment and must remain inspectable.
   */
  readonly analyze: (input: InvocationSemanticInput) => InvocationSemanticJudgment;
}

/** Runtime boundary: invokes a closed upstream authority contract; it owns no semantic rules. */
export interface InvocationSemanticRuntimeExecutorInterface {
  readonly kind: 'invocation_semantic_runtime_executor';
  readonly authority: 'upstream';
  /** Exact authority instance that owns every individual invocation judgment forwarded by this executor. */
  readonly invocationAuthority: InvocationSemanticAuthorityInterface;
  /** Exposes the authority contract that governs every individual result forwarded by this executor. */
  readonly contract: InvocationSemanticContract;
  /** Exact authority instance that owns whole-knowledge batch analysis; it is not inferred from a matching contract. */
  readonly batchAuthority: SemanticInterproceduralDataFlowAuthorityInterface;
  /** Contract governing executeAll; exposed separately because batch analysis is a distinct authority operation. */
  readonly batchContract: InvocationSemanticContract;
  /** Explicit call ownership; the executor may not bind either operation to a local semantic implementation. */
  readonly delegation: 'execute-to-InvocationSemanticAuthorityInterface.analyze;executeAll-to-SemanticInterproceduralDataFlowAuthorityInterface.analyze';
  /**
   * Pure delegation: return the same authority-validated judgment, including its
   * proof ruleTrace and obligations. Do not resolve targets, synthesize traces,
   * close judgments, or replace authority failures with fallback judgments.
   */
  readonly execute: (input: InvocationSemanticInput) => InvocationSemanticJudgment;
  /**
   * Analyze complete semantic knowledge (not a batch of independent inputs).
   * Preserve each invocation's validated judgment, proof trace, and obligations.
   */
  readonly executeAll: (knowledge: SemanticKnowledgeDataFlow) => InvocationSemanticAnalysis;
}

/**
 * Domain factory for assembling the invocation runtime boundary from the exact authorities
 * that own single-invocation and whole-knowledge judgments. Construction is an operation
 * on an explicit interface, not an exported parameterized function.
 */
export interface InvocationSemanticRuntimeExecutorFactoryInterface {
  readonly kind: 'invocation_semantic_runtime_executor_factory';
  readonly create: (
    authority: InvocationSemanticAuthorityInterface,
    batchAuthority: SemanticInterproceduralDataFlowAuthorityInterface,
  ) => InvocationSemanticRuntimeExecutorInterface;
}

/** Legacy batch interface retained separately from the canonical one-in/one-judgment authority. */
export interface SemanticInterproceduralDataFlowAuthorityInterface {
  /** Distinct boundary tag: this operation analyzes a whole knowledge graph, not one invocation. */
  readonly kind: 'invocation_semantic_batch_authority';
  readonly contract: InvocationSemanticContract;
  /** Whole-knowledge analysis; each judgment retains its own authority-validated proof trace. */
  readonly analyze: (knowledge: SemanticKnowledgeDataFlow) => InvocationSemanticAnalysis;
}

/** Compatibility aliases; the canonical contract is INVOCATION_SEMANTIC_CONTRACT. */
export type SemanticInvocationSemanticContract = InvocationSemanticContract;
export const SEMANTIC_INVOCATION_SEMANTIC_CONTRACT = INVOCATION_SEMANTIC_CONTRACT;
