import type { ControllerActionFlowContract } from './highLevelContracts';
import type { LaravelControllerScanJudgment } from './laravelControllerScannerInterface';
import type { ModelDefinition } from './model';
import type { RouteAst } from './ast';
import type { RouteIdentity } from './route';
import type { ModelReference, ResourceReference } from './semanticReferences';
import type { SourceSpan } from './provenance';
import type { ChannelName } from './names';
import type { BroadcastChannelKind } from '../domain/channels';
import type { ResourceModelBindingBatchClosureModelInterface, ResourceModelBindingBatchStateSemanticsInterface, ResourceModelBindingSemanticJudgmentModelInterface, ResourceModelBindingSemanticRuleSetInterface } from './resourceModelBindingSemanticInterface';

/** Source evidence exists even when the route target is dynamic or has no candidate. */
export interface RouteControllerBindingSourceEvidence {
  readonly kind: 'route_controller_binding_source_evidence';
  readonly route: RouteIdentity;
  readonly source: SourceSpan;
  readonly targetForm: 'static_controller_action' | 'dynamic_or_unproven';
}

/** Route-side evidence paired with one candidate by RouteControllerBindingCandidate. */
export interface RouteControllerBindingCandidateEvidence {
  readonly kind: 'route_controller_binding_candidate_evidence';
  readonly route: RouteIdentity;
  readonly source: SourceSpan;
  readonly targetForm: 'static_controller_action';
}

export type RouteControllerBindingSourceEvidenceSet = readonly [
  RouteControllerBindingSourceEvidence,
  ...RouteControllerBindingSourceEvidence[],
];

/** Candidate and its proof are inseparable; the evidence does not duplicate candidate identity. */
export interface RouteControllerBindingCandidate {
  readonly action: ControllerActionFlowContract;
  readonly evidence: RouteControllerBindingCandidateEvidence;
}

/** A closed outcome: unresolved and ambiguous bindings are first-class, never silently guessed. */
export type RouteControllerBindingOutcome =
  | {
      readonly kind: 'resolved';
      readonly candidate: RouteControllerBindingCandidate;
    }
  | {
      readonly kind: 'unresolved';
      readonly reason: 'no_controller_action_candidate' | 'route_target_not_static';
      readonly evidence: RouteControllerBindingSourceEvidenceSet;
    }
  | {
      readonly kind: 'ambiguous';
      readonly candidates: readonly [RouteControllerBindingCandidate, RouteControllerBindingCandidate, ...RouteControllerBindingCandidate[]];
    };

export interface RouteControllerBindingJudgment {
  readonly kind: 'route_controller_binding_judgment';
  readonly route: RouteIdentity;
  readonly outcome: RouteControllerBindingOutcome;
}

/** Input to the authority that resolves route targets against already-derived controller actions. */
export interface RouteControllerBindingJudgmentInput {
  readonly kind: 'route_controller_binding_judgment_input';
  readonly route: RouteAst;
  readonly controllerActions: readonly ControllerActionFlowContract[];
}

export interface RouteControllerBindingJudgmentAuthority {
  readonly kind: 'route_controller_binding_judgment_authority';
  readonly closed: true;
  readonly judge: (input: RouteControllerBindingJudgmentInput) => RouteControllerBindingJudgment;
}

/**
 * A resource binding subject deliberately excludes ResourceDefinition: that
 * definition already contains a model field, so using it as judgment input
 * would make the authority consume the answer it is supposed to derive.
 */
export interface ResourceModelBindingSubject {
  readonly kind: 'resource_model_binding_subject';
  /** Canonical resource identity; the name is derived from this reference, never duplicated. */
  readonly resource: ResourceReference;
  readonly source: SourceSpan;
}

/** Source evidence that a resource was examined, even when no model candidate exists. */
export interface ResourceModelBindingSourceEvidence {
  readonly kind: 'resource_model_binding_source_evidence';
  readonly resource: ResourceReference;
  readonly source: SourceSpan;
  readonly basis: 'resource_declaration' | 'controller_dataflow' | 'relation_propagation' | 'convention' | 'structural';
}

export type ResourceModelBindingSourceEvidenceSet = readonly [
  ResourceModelBindingSourceEvidence,
  ...ResourceModelBindingSourceEvidence[],
];

/** Candidate evidence binds one source fact to the exact resource/model pair it supports. */
export interface ResourceModelBindingEvidence {
  readonly kind: 'resource_model_binding_evidence';
  readonly resource: ResourceReference;
  readonly model: ModelReference;
  readonly source: SourceSpan;
  /** Must stay aligned with ResourceModelCandidateSource in resourceModelReasoning. */
  readonly basis: 'controller_dataflow' | 'relation_propagation' | 'convention' | 'structural';
}

/** A candidate and its own evidence are inseparable; evidence cannot drift across candidates. */
export interface ResourceModelBindingCandidate {
  readonly model: ModelDefinition;
  readonly evidence: readonly [ResourceModelBindingEvidence, ...ResourceModelBindingEvidence[]];
}

export interface ResourceRelationBindingEvidence {
  readonly kind: 'resource_relation_binding_evidence';
  readonly parent: ResourceReference;
  readonly child: ResourceReference;
  readonly relation: import('./names').RelationName;
  readonly source: SourceSpan;
}

/** A resolved model must carry at least one evidence item. */
export type ResourceModelBindingOutcome =
  | {
      readonly kind: 'resolved';
      readonly subject: ResourceModelBindingSubject;
      readonly candidate: ResourceModelBindingCandidate;
    }
  | {
      readonly kind: 'unresolved';
      readonly subject: ResourceModelBindingSubject;
      readonly reason: 'no_model_candidate' | 'controller_binding_unresolved' | 'relation_binding_unresolved';
      readonly evidence: ResourceModelBindingSourceEvidenceSet;
    }
  | {
      readonly kind: 'ambiguous';
      readonly subject: ResourceModelBindingSubject;
      readonly candidates: readonly [ResourceModelBindingCandidate, ResourceModelBindingCandidate, ...ResourceModelBindingCandidate[]];
    };

/** Exhaustive eliminator for an already-closed binding outcome; it does not decide the outcome. */
export interface ResourceModelBindingOutcomeVisitor<Result> {
  readonly resolved: (outcome: Extract<ResourceModelBindingOutcome, { readonly kind: 'resolved' }>) => Result;
  readonly unresolved: (outcome: Extract<ResourceModelBindingOutcome, { readonly kind: 'unresolved' }>) => Result;
  readonly ambiguous: (outcome: Extract<ResourceModelBindingOutcome, { readonly kind: 'ambiguous' }>) => Result;
}

export interface ResourceModelBindingOutcomeFoldInterface {
  readonly kind: 'resource_model_binding_outcome_fold';
  readonly fold: <Result>(outcome: ResourceModelBindingOutcome, visitor: ResourceModelBindingOutcomeVisitor<Result>) => Result;
}

export const resourceModelBindingOutcomeFold: ResourceModelBindingOutcomeFoldInterface = Object.freeze({
  kind: 'resource_model_binding_outcome_fold',
  fold: <Result>(outcome: ResourceModelBindingOutcome, visitor: ResourceModelBindingOutcomeVisitor<Result>): Result => {
    switch (outcome.kind) {
      case 'resolved': return visitor.resolved(outcome);
      case 'unresolved': return visitor.unresolved(outcome);
      case 'ambiguous': return visitor.ambiguous(outcome);
    }
  },
});

export interface ResourceModelBindingJudgment {
  readonly kind: 'resource_model_binding_judgment';
  readonly outcome: ResourceModelBindingOutcome;
}

/**
 * Inputs are source-level candidates and relation evidence, not a ResourceDefinition
 * with a pre-filled model. The authority receives the complete controller scan judgment
 * so action contracts remain correlated with each controller's integrated invocation
 * semantic response; it must not accept a detached controllerActions projection.
 */
export interface ResourceModelBindingJudgmentInput {
  readonly kind: 'resource_model_binding_judgment_input';
  readonly subject: ResourceModelBindingSubject;
  readonly models: readonly ModelDefinition[];
  readonly controllerScan: LaravelControllerScanJudgment;
  readonly relations: readonly ResourceRelationBindingEvidence[];
  /** Previous whole-project judgments supplied only by the batch closure operation. */
  readonly knownBindings: readonly ResourceModelBindingJudgment[];
}

export interface ResourceModelBindingBatchJudgmentInput {
  readonly kind: 'resource_model_binding_batch_judgment_input';
  readonly subjects: readonly ResourceModelBindingSubject[];
  readonly models: readonly ModelDefinition[];
  readonly controllerScan: LaravelControllerScanJudgment;
  readonly relations: readonly ResourceRelationBindingEvidence[];
}

export type ResourceModelBindingClosureResolution =
  | { readonly kind: 'stable_fixed_point' }
  | { readonly kind: 'cycle_conservative'; readonly affectedResources: readonly [ResourceReference, ...ResourceReference[]] };

/** The closure receipt distinguishes a stable fixed point from conservative cycle handling. */
export interface ResourceModelBindingBatchClosure {
  readonly kind: 'resource_model_binding_fixed_point_closure';
  readonly closed: true;
  readonly basis: 'whole-resource-model-candidate-lattice';
  readonly resolution: ResourceModelBindingClosureResolution;
}

/** One judgment remains inseparably correlated with the exact source subject it closes. */
export interface ResourceModelBindingSubjectJudgment {
  readonly kind: 'resource_model_binding_subject_judgment';
  /** The exact subject object supplied to the authority; identity is not reconstructed downstream. */
  readonly subject: ResourceModelBindingSubject;
  readonly judgment: ResourceModelBindingJudgment;
}

/**
 * A closed batch exposes subject-judgment pairs, never a detached judgment array whose
 * meaning depends on parallel-array position. The authority owns source correspondence.
 */
export type ResourceModelBindingBatchCompleteness =
  | { readonly kind: 'resource_model_binding_batch_complete' }
  | { readonly kind: 'resource_model_binding_batch_blocked'; readonly rejectedSubjects: readonly ResourceModelBindingSubject[] };

export interface ResourceModelBindingBatchCompletenessVisitor<Result> {
  readonly complete: (judgment: Extract<ResourceModelBindingBatchCompleteness, { readonly kind: 'resource_model_binding_batch_complete' }>) => Result;
  readonly blocked: (judgment: Extract<ResourceModelBindingBatchCompleteness, { readonly kind: 'resource_model_binding_batch_blocked' }>) => Result;
}

export interface ResourceModelBindingBatchCompletenessFoldInterface {
  readonly kind: 'resource_model_binding_batch_completeness_fold';
  readonly fold: <Result>(judgment: ResourceModelBindingBatchCompleteness, visitor: ResourceModelBindingBatchCompletenessVisitor<Result>) => Result;
}

/** Eliminates the completeness judgment already closed by the binding authority. */
export const resourceModelBindingBatchCompletenessFold: ResourceModelBindingBatchCompletenessFoldInterface = Object.freeze({
  kind: 'resource_model_binding_batch_completeness_fold',
  fold: <Result>(judgment: ResourceModelBindingBatchCompleteness, visitor: ResourceModelBindingBatchCompletenessVisitor<Result>): Result => {
    switch (judgment.kind) {
      case 'resource_model_binding_batch_complete': return visitor.complete(judgment);
      case 'resource_model_binding_batch_blocked': return visitor.blocked(judgment);
    }
  },
});

export interface ResourceModelBindingBatchJudgment {
  readonly kind: 'resource_model_binding_batch_judgment';
  readonly contractVersion: 3;
  readonly closure: ResourceModelBindingBatchClosure;
  readonly completeness: ResourceModelBindingBatchCompleteness;
  readonly bindings: readonly ResourceModelBindingSubjectJudgment[];
}


export interface ResourceModelBindingJudgmentAuthority {
  readonly kind: 'resource_model_binding_judgment_authority';
  readonly closed: true;
  readonly contractVersion: 5;
  /** The exact upstream semantic model and rewrite rules this executor realizes. */
  readonly semanticModel: ResourceModelBindingSemanticJudgmentModelInterface;
  readonly closureModel: ResourceModelBindingBatchClosureModelInterface;
  readonly ruleSet: ResourceModelBindingSemanticRuleSetInterface;
  /** Upstream contract for exact subject-to-judgment correspondence during closure. */
  readonly batchState: ResourceModelBindingBatchStateSemanticsInterface;
  /** Canonical lookup for downstream projection; the scanner does not search or reclassify. */
  readonly bindingForSubject: (
    batch: ResourceModelBindingBatchJudgment,
    subject: ResourceModelBindingSubject,
  ) => ResourceModelBindingSubjectJudgment;
  readonly judgmentCorrespondence: 'each_binding_retains_exact_input_subject_and_its_closed_judgment';
  readonly closureCorrespondence: 'state-transition-and-cycle-impact-use-exact-subject-identity-not-array-index';
  readonly judge: (input: ResourceModelBindingJudgmentInput) => ResourceModelBindingJudgment;
  /** Closes relation propagation and subject correspondence before scanner projection begins. */
  readonly judgeBatch: (input: ResourceModelBindingBatchJudgmentInput) => ResourceModelBindingBatchJudgment;
}



/** A Laravel server-side channel declaration proves a name, not its client subscription mode. */
export interface BroadcastChannelDeclarationEvidence {
  readonly kind: 'broadcast_channel_declaration_evidence';
  readonly channel: ChannelName;
  readonly source: SourceSpan;
}

/** Client-side subscription evidence is required to establish public/private/presence semantics. */
export interface BroadcastChannelSubscriptionEvidence {
  readonly kind: 'broadcast_channel_subscription_evidence';
  readonly channel: ChannelName;
  readonly subscriptionKind: BroadcastChannelKind;
  readonly source: SourceSpan;
}

export interface BroadcastChannelKindCandidate {
  readonly kind: 'broadcast_channel_kind_candidate';
  readonly subscriptionKind: BroadcastChannelKind;
  readonly evidence: readonly [BroadcastChannelSubscriptionEvidence, ...BroadcastChannelSubscriptionEvidence[]];
}

export type BroadcastChannelKindOutcome =
  | {
      readonly kind: 'resolved';
      readonly declaration: BroadcastChannelDeclarationEvidence;
      readonly candidate: BroadcastChannelKindCandidate;
    }
  | {
      readonly kind: 'unresolved';
      readonly declaration: BroadcastChannelDeclarationEvidence;
      readonly reason: 'no-client-subscription-evidence';
    }
  | {
      readonly kind: 'ambiguous';
      readonly declaration: BroadcastChannelDeclarationEvidence;
      readonly candidates: readonly [BroadcastChannelKindCandidate, BroadcastChannelKindCandidate, ...BroadcastChannelKindCandidate[]];
    };

export interface BroadcastChannelKindJudgment {
  readonly kind: 'broadcast_channel_kind_judgment';
  readonly outcome: BroadcastChannelKindOutcome;
}

export interface BroadcastChannelKindJudgmentInput {
  readonly kind: 'broadcast_channel_kind_judgment_input';
  readonly declaration: BroadcastChannelDeclarationEvidence;
  readonly subscriptionEvidence: readonly BroadcastChannelSubscriptionEvidence[];
}

/** Authority contract: never infer channel mode from words embedded in the channel pattern. */
export interface BroadcastChannelKindJudgmentAuthority {
  readonly kind: 'broadcast_channel_kind_judgment_authority';
  readonly closed: true;
  readonly judge: (input: BroadcastChannelKindJudgmentInput) => BroadcastChannelKindJudgment;
}

/** Contract invariants consumed by audits and later authority implementations. */
export interface LaravelScannerSemanticJudgmentContract {
  readonly kind: 'laravel_scanner_semantic_judgment_contract';
  readonly version: 9;
  readonly routeController: 'derive-from-route-source-and-canonical-controller-actions';
  readonly resourceModel: 'derive-from-source-level-resource-subject-model-candidates-controller-dataflow-and-relation-evidence';
  readonly resourceCandidatePolicy: 'controller-dataflow-then-relation-propagation-then-convention-then-structural-with-distinct-top-precedence-model-ties-ambiguous';
  readonly resourceUnresolvedEvidence: 'non-empty-source-evidence-does-not-require-a-model-candidate';
  readonly resourceIdentity: 'resource-reference-is-the-only-canonical-resource-name-carrier';
  readonly resultCorrelation: 'scanner-products-are-paired-per-source-subject-not-parallel-arrays';
  readonly ambiguity: 'preserve-as-explicit-ambiguous-outcome';
  readonly unresolved: 'preserve-as-explicit-unresolved-outcome';
  readonly evidence: 'retain-source-span-and-subject-identity';
  readonly fixedPointEquality: 'compare-outcome-subject-candidate-and-source-provenance-with-typed-structural-equality';
  readonly candidateEvidence: 'bind-each-candidate-to-its-own-source-evidence';
  readonly routeCandidateCorrelation: 'each-route-candidate-owns-exactly-its-own-route-and-controller-evidence';
  readonly cardinality: 'resolved-one-candidate-ambiguous-two-or-more-unresolved-zero-candidates-with-source-evidence';
  readonly identityConsistency: 'judgment-route-evidence-route-and-candidate-identity-must-agree';
  readonly modelEvidenceConsistency: 'resource-candidate-model-and-every-evidence-model-must-agree';
  readonly scannerBoundary: 'scanner-collects-evidence-and-forwards-judgment-without-reclassification';
  readonly resourceRelationClosure: 'whole-resource-subject-set-is-closed-by-the-semantic-authority-before-resource-ast-projection-with-per-resource-cycle-receipt';
  readonly invocation: 'reuse-existing-invocation-semantic-authority-without-duplicating-resolution';
  readonly channelKind: 'derive-public-private-presence-only-from-source-backed-subscription-evidence-never-from-channel-name-heuristics';
  readonly channelKindCoverage: 'preserve-unresolved-and-ambiguous-subscription-evidence-as-closed-judgment-variants';
  readonly channelAstBoundary: 'source-only-channel-declaration-has-no-semantic-kind-and-canonical-channel-ast-exists-only-for-resolved-judgment';
}

export const LARAVEL_SCANNER_SEMANTIC_JUDGMENT_CONTRACT: LaravelScannerSemanticJudgmentContract = Object.freeze({
  kind: 'laravel_scanner_semantic_judgment_contract',
  version: 9,
  routeController: 'derive-from-route-source-and-canonical-controller-actions',
  resourceModel: 'derive-from-source-level-resource-subject-model-candidates-controller-dataflow-and-relation-evidence',
  resourceCandidatePolicy: 'controller-dataflow-then-relation-propagation-then-convention-then-structural-with-distinct-top-precedence-model-ties-ambiguous',
  resourceUnresolvedEvidence: 'non-empty-source-evidence-does-not-require-a-model-candidate',
  resourceIdentity: 'resource-reference-is-the-only-canonical-resource-name-carrier',
  resultCorrelation: 'scanner-products-are-paired-per-source-subject-not-parallel-arrays',
  ambiguity: 'preserve-as-explicit-ambiguous-outcome',
  unresolved: 'preserve-as-explicit-unresolved-outcome',
  evidence: 'retain-source-span-and-subject-identity',
  fixedPointEquality: 'compare-outcome-subject-candidate-and-source-provenance-with-typed-structural-equality',
  candidateEvidence: 'bind-each-candidate-to-its-own-source-evidence',
  routeCandidateCorrelation: 'each-route-candidate-owns-exactly-its-own-route-and-controller-evidence',
  cardinality: 'resolved-one-candidate-ambiguous-two-or-more-unresolved-zero-candidates-with-source-evidence',
  identityConsistency: 'judgment-route-evidence-route-and-candidate-identity-must-agree',
  modelEvidenceConsistency: 'resource-candidate-model-and-every-evidence-model-must-agree',
  scannerBoundary: 'scanner-collects-evidence-and-forwards-judgment-without-reclassification',
  resourceRelationClosure: 'whole-resource-subject-set-is-closed-by-the-semantic-authority-before-resource-ast-projection-with-source-provenance-stable-equality-and-declarative-precedence',
  invocation: 'reuse-existing-invocation-semantic-authority-without-duplicating-resolution',
  channelKind: 'derive-public-private-presence-only-from-source-backed-subscription-evidence-never-from-channel-name-heuristics',
  channelKindCoverage: 'preserve-unresolved-and-ambiguous-subscription-evidence-as-closed-judgment-variants',
  channelAstBoundary: 'source-only-channel-declaration-has-no-semantic-kind-and-canonical-channel-ast-exists-only-for-resolved-judgment',
});
