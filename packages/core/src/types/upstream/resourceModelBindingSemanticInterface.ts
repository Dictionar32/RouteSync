/**
 * Closed upstream semantic model for resource-to-model binding.
 *
 * Source adapters contribute typed evidence facts. Candidate derivation,
 * relation propagation, precedence, and ambiguity preservation are declared
 * here and evaluated by the shared semantic-relation authority.
 */
import type { ResourceModelBindingCandidate, ResourceModelBindingEvidence, ResourceModelBindingJudgment, ResourceModelBindingSubject } from './laravelScannerSemanticJudgment';

/**
 * Cardinality is an explicit semantic ADT. Each variant carries only the
 * candidate shape permitted by its outcome, so an executor cannot construct a
 * resolved/ambiguous result from an incompatible candidate collection.
 */
export type ResourceModelBindingCandidateCardinality =
  | Readonly<{ readonly kind: 'no_candidate'; readonly candidates: readonly [] }>
  | Readonly<{ readonly kind: 'one_candidate'; readonly candidates: readonly [ResourceModelBindingCandidate] }>
  | Readonly<{ readonly kind: 'multiple_candidates'; readonly candidates: readonly [ResourceModelBindingCandidate, ResourceModelBindingCandidate, ...ResourceModelBindingCandidate[]] }>;

/** Declarative mapping from closed candidate cardinality to a domain outcome. */
export interface ResourceModelBindingOutcomeFormationModelInterface {
  readonly kind: 'resource_model_binding_outcome_formation_model';
  readonly contractVersion: 1;
  readonly authority: 'upstream_semantic_judgment_model';
  readonly noCandidate: Readonly<{
    readonly input: 'empty_candidate_set_with_subject_and_source_evidence';
    readonly output: 'unresolved';
    readonly preserve: 'subject_reason_and_source_evidence';
  }>;
  readonly oneCandidate: Readonly<{
    readonly input: 'singleton_candidate_with_candidate_specific_provenance';
    readonly output: 'resolved';
    readonly preserve: 'exact_candidate_and_its_evidence';
  }>;
  readonly multipleCandidates: Readonly<{
    readonly input: 'non_empty_candidate_set_with_at_least_two_distinct_candidates';
    readonly output: 'ambiguous';
    readonly preserve: 'all_distinct_candidates_and_candidate_specific_evidence';
  }>;
  readonly candidateIdentity: 'model_identity_plus_source_basis_and_source_span';
}

export const RESOURCE_MODEL_BINDING_OUTCOME_FORMATION_MODEL: ResourceModelBindingOutcomeFormationModelInterface = Object.freeze({
  kind: 'resource_model_binding_outcome_formation_model',
  contractVersion: 1,
  authority: 'upstream_semantic_judgment_model',
  noCandidate: Object.freeze({
    input: 'empty_candidate_set_with_subject_and_source_evidence',
    output: 'unresolved',
    preserve: 'subject_reason_and_source_evidence',
  }),
  oneCandidate: Object.freeze({
    input: 'singleton_candidate_with_candidate_specific_provenance',
    output: 'resolved',
    preserve: 'exact_candidate_and_its_evidence',
  }),
  multipleCandidates: Object.freeze({
    input: 'non_empty_candidate_set_with_at_least_two_distinct_candidates',
    output: 'ambiguous',
    preserve: 'all_distinct_candidates_and_candidate_specific_evidence',
  }),
  candidateIdentity: 'model_identity_plus_source_basis_and_source_span',
});


/**
 * Semantic contract for closed batch-state correspondence. A source subject's exact
 * canonical object identity binds it to its judgment; publication order is not identity.
 */
export interface ResourceModelBindingBatchStateSemanticsInterface {
  readonly kind: 'resource_model_binding_batch_state_semantics';
  readonly contractVersion: 1;
  readonly identity: Readonly<{
    readonly subject: 'exact-canonical-input-subject-object';
    readonly judgment: 'closed-judgment-correlated-to-that-exact-subject';
    readonly ordering: 'not-semantic-identity';
  }>;
  readonly stateEquivalence: Readonly<{
    readonly subjectCoverage: 'same-exact-subject-object-set';
    readonly judgment: 'same-closed-outcome-for-each-corresponding-subject';
    readonly order: 'irrelevant-to-equivalence';
  }>;
  readonly judgmentForSubject: (
    subject: ResourceModelBindingSubject,
    judgments: readonly ResourceModelBindingJudgment[],
  ) => ResourceModelBindingJudgment | undefined;
  readonly sameState: (
    left: readonly ResourceModelBindingJudgment[],
    right: readonly ResourceModelBindingJudgment[],
  ) => boolean;
}

export const RESOURCE_MODEL_BINDING_BATCH_STATE_SEMANTICS_IDENTITY = Object.freeze({
  subject: 'exact-canonical-input-subject-object',
  judgment: 'closed-judgment-correlated-to-that-exact-subject',
  ordering: 'not-semantic-identity',
} as const);

/**
 * Declarative ownership contract for carrying invocation semantics through the
 * Laravel resource judgment. This describes semantic correspondence; it does not
 * implement lookup, join, projection, or runtime execution.
 */
export interface ResourceModelBindingInvocationIntegrationModelInterface {
  readonly kind: 'resource_model_binding_invocation_integration_model';
  readonly contractVersion: 4;
  readonly sourceCorrelation: Readonly<{
    readonly controllerScan: 'retain-the-exact-closed-controller-scan-input';
    readonly controllerArtifact: 'each-artifact-retains-its-own-source-correlated-invocation-judgment';
    readonly invocationJudgment: 'retain-the-exact-judgment-owned-by-that-controller-artifact';
    readonly integratedResponse: 'retain-the-exact-response-nested-in-that-invocation-judgment';
    readonly resourceEvidence: 'derive-from-the-same-controller-artifact-that-owns-the-evidence';
  }>;
  readonly outcomePreservation: Readonly<{
    readonly kinds: readonly [
      'php_source_invocation_integration_not_connected',
      'php_source_invocation_integration_source_binding_rejected',
      'php_source_invocation_integration_complete',
      'php_source_invocation_integration_blocked',
    ];
    readonly transformation: 'preserve-the-original-discriminated-outcome-without-reclassification';
    readonly detachedResponse: 'forbidden';
    readonly sourceBindingReceipt: 'complete-and-blocked-integrated-responses-retain-the-exact-closed-source-binding-judgment';
    readonly rejectedSourceBindingEvidence: 'rejected-integrated-response-retains-the-exact-rejected-source-binding-judgment-and-original-pipeline-result';
    readonly sourceIdentityRelation: 'preserve-the-exact-typed-source-file-identity-relation-within-each-binding-judgment';
  }>;
  readonly forbiddenCorrespondence: readonly [
    'controller-resource-join-by-array-index',
    'invocation-judgment-reconstruction',
    'integrated-response-copy-into-detached-sidecar',
    'not-connected-or-blocked-outcome-promoted-to-success',
  ];
  readonly subscannerRetirement: Readonly<{
    readonly prerequisite: 'upstream-source-correlated-contract-must-own-the-required-judgment-before-retirement';
    readonly remainingScannerRole: 'consume-closed-judgment-and-project-source-artifacts-only';
    readonly semanticFallback: 'forbidden';
  }>;
}

export const RESOURCE_MODEL_BINDING_INVOCATION_INTEGRATION_MODEL: ResourceModelBindingInvocationIntegrationModelInterface = Object.freeze({
  kind: 'resource_model_binding_invocation_integration_model',
  contractVersion: 4,
  sourceCorrelation: Object.freeze({
    controllerScan: 'retain-the-exact-closed-controller-scan-input',
    controllerArtifact: 'each-artifact-retains-its-own-source-correlated-invocation-judgment',
    invocationJudgment: 'retain-the-exact-judgment-owned-by-that-controller-artifact',
    integratedResponse: 'retain-the-exact-response-nested-in-that-invocation-judgment',
    resourceEvidence: 'derive-from-the-same-controller-artifact-that-owns-the-evidence',
  }),
  outcomePreservation: Object.freeze({
    kinds: Object.freeze([
      'php_source_invocation_integration_not_connected',
      'php_source_invocation_integration_source_binding_rejected',
      'php_source_invocation_integration_complete',
      'php_source_invocation_integration_blocked',
    ] as const),
    transformation: 'preserve-the-original-discriminated-outcome-without-reclassification',
    detachedResponse: 'forbidden',
    sourceBindingReceipt: 'complete-and-blocked-integrated-responses-retain-the-exact-closed-source-binding-judgment',
    rejectedSourceBindingEvidence: 'rejected-integrated-response-retains-the-exact-rejected-source-binding-judgment-and-original-pipeline-result',
    sourceIdentityRelation: 'preserve-the-exact-typed-source-file-identity-relation-within-each-binding-judgment',
  }),
  forbiddenCorrespondence: Object.freeze([
    'controller-resource-join-by-array-index',
    'invocation-judgment-reconstruction',
    'integrated-response-copy-into-detached-sidecar',
    'not-connected-or-blocked-outcome-promoted-to-success',
  ] as const),
  subscannerRetirement: Object.freeze({
    prerequisite: 'upstream-source-correlated-contract-must-own-the-required-judgment-before-retirement',
    remainingScannerRole: 'consume-closed-judgment-and-project-source-artifacts-only',
    semanticFallback: 'forbidden',
  }),
});

/**
 * Domain-level judgment semantics shared by the rule model and its executor.
 * The model owns the declared semantic partitions; execution materializes a
 * judgment that conforms to those partitions instead of inventing local policy.
 */
/**
 * Closed upstream contract for whole-project binding convergence. The executor
 * correlates state transitions and cycle impact by the exact source subject
 * object; array position is never semantic identity.
 */
export interface ResourceModelBindingBatchClosureModelInterface {
  readonly kind: 'resource_model_binding_batch_closure_model';
  readonly contractVersion: 1;
  readonly stateIdentity: Readonly<{
    readonly subject: 'exact-input-subject-object';
    readonly equality: 'reference-identity-of-the-canonical-subject';
    readonly state: 'same-subject-object-set-and-same-closed-judgment-per-subject';
    readonly ordering: 'ignored-for-state-equivalence-preserved-for-publication';
  }>;
  readonly transition: Readonly<{
    readonly recomputation: 'derive-each-subject-from-the-complete-prior-state';
    readonly stable: 'next-state-equivalent-to-current-state';
    readonly cycle: 'next-state-equivalent-to-any-prior-state';
  }>;
  readonly cycleDisposition: Readonly<{
    readonly affected: 'only-exact-subject-objects-whose-judgment-changes-across-the-repeated-cycle';
    readonly affectedOutcome: 'unresolved-with-source-evidence';
    readonly unaffectedOutcome: 'preserve-judgment-from-repeated-state';
  }>;
  readonly publication: Readonly<{
    readonly closureRequired: true;
    readonly subjectOrder: 'original-input-order';
    readonly correspondence: 'exact-subject-object-and-judgment-pair';
  }>;
}

export const RESOURCE_MODEL_BINDING_BATCH_CLOSURE_MODEL: ResourceModelBindingBatchClosureModelInterface = Object.freeze({
  kind: 'resource_model_binding_batch_closure_model',
  contractVersion: 1,
  stateIdentity: Object.freeze({
    subject: 'exact-input-subject-object',
    equality: 'reference-identity-of-the-canonical-subject',
    state: 'same-subject-object-set-and-same-closed-judgment-per-subject',
    ordering: 'ignored-for-state-equivalence-preserved-for-publication',
  }),
  transition: Object.freeze({
    recomputation: 'derive-each-subject-from-the-complete-prior-state',
    stable: 'next-state-equivalent-to-current-state',
    cycle: 'next-state-equivalent-to-any-prior-state',
  }),
  cycleDisposition: Object.freeze({
    affected: 'only-exact-subject-objects-whose-judgment-changes-across-the-repeated-cycle',
    affectedOutcome: 'unresolved-with-source-evidence',
    unaffectedOutcome: 'preserve-judgment-from-repeated-state',
  }),
  publication: Object.freeze({
    closureRequired: true,
    subjectOrder: 'original-input-order',
    correspondence: 'exact-subject-object-and-judgment-pair',
  }),
});

export interface ResourceModelBindingSemanticJudgmentModelInterface {
  readonly kind: 'resource_model_binding_semantic_judgment_model';
  readonly contractVersion: 7;
  readonly batchStateIdentity: typeof RESOURCE_MODEL_BINDING_BATCH_STATE_SEMANTICS_IDENTITY;
  readonly evidencePrecedence: readonly ResourceModelBindingEvidence['basis'][];
  readonly candidateSelection: 'all_candidates_at_highest_supported_precedence';
  readonly provenance: 'preserve_source_span_per_resource_model_basis';
  readonly ambiguity: 'preserve_all_distinct_candidates_and_evidence';
  readonly unresolved: 'retain_subject_and_source_evidence';
  readonly relationClosure: 'least_fixed_point_over_whole_resource_model_lattice';
  readonly cycleResolution: 'mark_only_non_stable_resource_judgments_unresolved';
  readonly ordering: 'preserve_input_subject_order';
  readonly controllerEvidence: 'consume_complete_integrated_controller_scan_judgment';
  /** Outcome formation is a closed judgment over the selected candidate set, never a scanner classification. */
  readonly outcomeFormation: ResourceModelBindingOutcomeFormationModelInterface;
  /** A batch judgment is the semantic closure result consumed by downstream projection. */
  readonly batchClosure: ResourceModelBindingBatchClosureModelInterface;
  /** Invocation integration and source correspondence are owned by a named upstream model. */
  readonly integratedResponse: ResourceModelBindingInvocationIntegrationModelInterface;
}

export const RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL: ResourceModelBindingSemanticJudgmentModelInterface = Object.freeze({
  kind: 'resource_model_binding_semantic_judgment_model',
  contractVersion: 7,
  batchStateIdentity: RESOURCE_MODEL_BINDING_BATCH_STATE_SEMANTICS_IDENTITY,
  evidencePrecedence: Object.freeze<ResourceModelBindingEvidence['basis'][]>(['controller_dataflow', 'relation_propagation', 'convention', 'structural']),
  candidateSelection: 'all_candidates_at_highest_supported_precedence',
  provenance: 'preserve_source_span_per_resource_model_basis',
  ambiguity: 'preserve_all_distinct_candidates_and_evidence',
  unresolved: 'retain_subject_and_source_evidence',
  relationClosure: 'least_fixed_point_over_whole_resource_model_lattice',
  cycleResolution: 'mark_only_non_stable_resource_judgments_unresolved',
  ordering: 'preserve_input_subject_order',
  controllerEvidence: 'consume_complete_integrated_controller_scan_judgment',
  outcomeFormation: RESOURCE_MODEL_BINDING_OUTCOME_FORMATION_MODEL,
  batchClosure: RESOURCE_MODEL_BINDING_BATCH_CLOSURE_MODEL,
  integratedResponse: RESOURCE_MODEL_BINDING_INVOCATION_INTEGRATION_MODEL,
});

export type ResourceModelBindingSemanticRelation =
  | 'resource_model_candidate_evidence'
  | 'resource_model_candidate_provenance'
  | 'resource_model_selected_precedence'
  | 'resource_model_selected_candidate'
  | 'resource_model_prior_selected_candidate'
  | 'resource_model_class_origin'
  | 'resource_model_table_origin'
  | 'resource_model_alias'
  | 'resource_model_short_name'
  | 'resource_model_table_name'
  | 'resource_model_convention_key'
  | 'resource_model_resource_relation'
  | 'resource_model_model_relation_target';


/**
 * Resource-model rule syntax is owned by this upstream semantic contract. It is
 * intentionally limited to the closed string vocabulary used by this rule set;
 * the legacy relation executor may consume it structurally during migration,
 * but this contract does not import its implementation types.
 */
export interface ResourceModelBindingRuleVariable {
  readonly variable: string;
}

export type ResourceModelBindingRuleTerm = string | ResourceModelBindingRuleVariable;

export interface ResourceModelBindingRulePattern {
  readonly relation: ResourceModelBindingSemanticRelation;
  readonly arguments: readonly ResourceModelBindingRuleTerm[];
  readonly polarity?: 'positive' | 'negative';
}

export interface ResourceModelBindingSemanticRule {
  readonly id: string;
  readonly priority: number;
  readonly when: readonly ResourceModelBindingRulePattern[];
  readonly then: readonly ResourceModelBindingRulePattern[];
}

export interface ResourceModelBindingSemanticRuleSetInterface {
  readonly kind: 'resource_model_binding_semantic_rule_set';
  readonly contractVersion: 2;
  readonly authority: 'upstream_semantic_model';
  readonly candidateEvidenceRelation: 'resource_model_candidate_evidence';
  readonly candidateProvenanceRelation: 'resource_model_candidate_provenance';
  readonly selectedPrecedenceRelation: 'resource_model_selected_precedence';
  readonly selectedCandidateRelation: 'resource_model_selected_candidate';
  readonly precedence: ResourceModelBindingSemanticJudgmentModelInterface['evidencePrecedence'];
  readonly judgmentModel: ResourceModelBindingSemanticJudgmentModelInterface;
  readonly rules: readonly ResourceModelBindingSemanticRule[];
  readonly closure: 'least_fixed_point';
  readonly ambiguity: 'preserve_all_candidates_at_selected_precedence';
  readonly missingEvidence: 'unresolved';
}

const resource: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'resource' });
const model: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'model' });
const basis: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'basis' });
const evidenceId: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'evidenceId' });
const originName: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'originName' });
const modelAlias: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'modelAlias' });
const tableName: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'tableName' });
const relationName: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'relationName' });
const childResource: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'childResource' });
const childModel: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'childModel' });
const parentModel: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'parentModel' });
const relationEvidenceId: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'relationEvidenceId' });
const conventionKey: ResourceModelBindingRuleVariable = Object.freeze({ variable: 'conventionKey' });

const pattern = (relation: ResourceModelBindingSemanticRelation, arguments_: readonly ResourceModelBindingRuleTerm[], polarity: 'positive' | 'negative' = 'positive'): ResourceModelBindingRulePattern => ({ relation, arguments: arguments_, polarity });
const factPattern = (relation: ResourceModelBindingSemanticRelation, arguments_: readonly ResourceModelBindingRuleTerm[]) => pattern(relation, arguments_);
const candidateEvidence = (selectedBasis: ResourceModelBindingEvidence['basis']) => factPattern('resource_model_candidate_evidence', [resource, model, selectedBasis]);
const candidateEvidenceAtBasis = factPattern('resource_model_candidate_evidence', [resource, model, basis]);
const selectedPrecedence = (selectedBasis: ResourceModelBindingEvidence['basis']) => factPattern('resource_model_selected_precedence', [resource, selectedBasis]);
const selectedPrecedenceAtBasis = factPattern('resource_model_selected_precedence', [resource, basis]);
const absenceOfHigherEvidence = (selectedBasis: ResourceModelBindingEvidence['basis']) => pattern('resource_model_candidate_evidence', [resource, modelAlias, selectedBasis], 'negative');
const candidateWithProvenance = (selectedBasis: ResourceModelBindingEvidence['basis'], sourceId: ResourceModelBindingRuleVariable): readonly ResourceModelBindingRulePattern[] => [
  factPattern('resource_model_candidate_evidence', [resource, model, selectedBasis]),
  factPattern('resource_model_candidate_provenance', [resource, model, selectedBasis, sourceId]),
];

/**
 * These rules derive candidates from typed source facts. Host code maps AST and
 * source spans into facts, but does not decide which model a resource means.
 */
export const RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET: ResourceModelBindingSemanticRuleSetInterface = Object.freeze({
  kind: 'resource_model_binding_semantic_rule_set',
  contractVersion: 2,
  authority: 'upstream_semantic_model',
  candidateEvidenceRelation: 'resource_model_candidate_evidence',
  candidateProvenanceRelation: 'resource_model_candidate_provenance',
  selectedPrecedenceRelation: 'resource_model_selected_precedence',
  selectedCandidateRelation: 'resource_model_selected_candidate',
  precedence: RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL.evidencePrecedence,
  judgmentModel: RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL,
  rules: Object.freeze([
    {
      id: 'resource-model-controller-class-origin', priority: 0,
      when: [factPattern('resource_model_class_origin', [resource, originName, evidenceId]), factPattern('resource_model_alias', [model, originName])],
      then: candidateWithProvenance('controller_dataflow', evidenceId),
    },
    {
      id: 'resource-model-controller-table-origin', priority: 1,
      when: [factPattern('resource_model_table_origin', [resource, tableName, evidenceId]), factPattern('resource_model_table_name', [model, tableName])],
      then: candidateWithProvenance('controller_dataflow', evidenceId),
    },
    {
      id: 'resource-model-convention-candidate', priority: 2,
      when: [factPattern('resource_model_convention_key', [resource, conventionKey, evidenceId]), factPattern('resource_model_short_name', [model, conventionKey])],
      then: candidateWithProvenance('convention', evidenceId),
    },
    {
      id: 'resource-model-precedence-controller-dataflow', priority: 10,
      when: [candidateEvidence('controller_dataflow')],
      then: [selectedPrecedence('controller_dataflow')],
    },
    {
      id: 'resource-model-precedence-relation-propagation', priority: 11,
      when: [candidateEvidence('relation_propagation'), absenceOfHigherEvidence('controller_dataflow')],
      then: [selectedPrecedence('relation_propagation')],
    },
    {
      id: 'resource-model-precedence-convention', priority: 12,
      when: [candidateEvidence('convention'), absenceOfHigherEvidence('controller_dataflow'), absenceOfHigherEvidence('relation_propagation')],
      then: [selectedPrecedence('convention')],
    },
    {
      id: 'resource-model-precedence-structural', priority: 13,
      when: [candidateEvidence('structural'), absenceOfHigherEvidence('controller_dataflow'), absenceOfHigherEvidence('relation_propagation'), absenceOfHigherEvidence('convention')],
      then: [selectedPrecedence('structural')],
    },
    {
      id: 'resource-model-select-candidate-at-winning-tier', priority: 14,
      when: [candidateEvidenceAtBasis, selectedPrecedenceAtBasis],
      then: [factPattern('resource_model_selected_candidate', [resource, model])],
    },
    {
      id: 'resource-model-relation-propagation', priority: 20,
      when: [
        factPattern('resource_model_resource_relation', [resource, childResource, relationName, relationEvidenceId]),
        factPattern('resource_model_model_relation_target', [parentModel, relationName, modelAlias]),
        factPattern('resource_model_alias', [childModel, modelAlias]),
        factPattern('resource_model_prior_selected_candidate', [childResource, childModel]),
      ],
      then: [
        factPattern('resource_model_candidate_evidence', [resource, parentModel, 'relation_propagation']),
        factPattern('resource_model_candidate_provenance', [resource, parentModel, 'relation_propagation', relationEvidenceId]),
      ],
    },
  ]),
  closure: 'least_fixed_point',
  ambiguity: 'preserve_all_candidates_at_selected_precedence',
  missingEvidence: 'unresolved',
});
