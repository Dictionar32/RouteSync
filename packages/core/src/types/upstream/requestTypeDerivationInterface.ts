/**
 * Canonical upstream semantic contract for RequestType derivation.
 *
 * This is a semantic model, not an execution pipeline. It describes the source
 * evidence, resolution relations, contribution laws, conflict states and closure
 * conditions that an authority must establish. Scanner and runtime code must
 * consume this contract; they must not invent a second policy locally.
 */
import type { RequestType } from '../domain/request';
import type { RouteSemanticFlow } from '../domain/routes';
import type { RequestAst, ResourceAst } from './ast';

export const REQUEST_TYPE_DERIVATION_LAW_IDS = [
  'route_has_explicit_request_binding',
  'request_identity_exact_match',
  'request_identity_normalized_unique_match',
  'ambiguous_identity_is_conflict',
  'resource_identity_is_canonical',
  'route_contributes_action',
  'route_contributes_response',
  'group_contributions_are_reconciled',
  'every_source_has_a_disposition',
  'evidence_key_matches_source_domain',
  'source_evidence_inventory_matches_input',
  'framework_request_binding_is_accounted_exclusion',
  'request_binding_kind_matches_route_disposition',
  'every_group_contribution_has_receipt',
  'judgment_closure_matches_source_ledger',
  'group_receipt_matches_judgment_output',
  'contributed_route_has_resolved_resource',
  'contribution_transition_is_contiguous',
  'contribution_transition_matches_policy',
  'group_result_matches_final_transition',
  'group_key_matches_resource_identity',
  'judgment_kind_matches_closure',
  'judgment_payload_matches_proof_ledger',
  'incomplete_judgment_matches_unresolved_ledger',
  'conflict_judgment_matches_conflict_ledger',
  'authority_policy_matches_contract',
  'invalid_input_requires_typed_counterexample',
  'input_rejection_matches_source_evidence',
  'duplicate_occurrences_match_collision_key',
  'duplicate_occurrences_are_distinct_source_locations',
  'all_duplicate_occurrence_locations_are_pairwise_distinct',
  'source_occurrence_key_matches_source_coordinates',
  'source_occurrence_location_matches_evidence',
  'source_occurrence_belongs_to_input',
] as const;

export type RequestTypeDerivationLawId = typeof REQUEST_TYPE_DERIVATION_LAW_IDS[number];

/**
 * Canonical obligation inventory for the closed RequestType derivation law set.
 * This describes what a verifier must establish; it is not itself verification
 * evidence and must never be treated as proof that a law has been checked.
 */
export type RequestTypeDerivationLawWitnessKind =
  | 'route_disposition_binding_evidence' | 'exact_request_identity_match' | 'unique_normalized_request_match'
  | 'ambiguous_identity_conflict' | 'canonical_resource_identity' | 'action_contribution_receipt'
  | 'response_contribution_receipt' | 'group_contribution_reconciliation' | 'complete_source_disposition'
  | 'source_domain_key_correlation' | 'input_inventory_correlation' | 'framework_binding_exclusion'
  | 'binding_kind_disposition_correlation' | 'group_contribution_receipt_coverage' | 'source_ledger_closure'
  | 'receipt_judgment_output_correlation' | 'contributed_route_resource_resolution' | 'contiguous_contribution_transition'
  | 'policy_contribution_transition' | 'final_group_transition_correlation' | 'canonical_group_resource_identity'
  | 'judgment_closure_correlation' | 'judgment_proof_ledger_correlation' | 'incomplete_unresolved_ledger_correlation'
  | 'conflict_ledger_correlation' | 'authority_contract_policy_correlation' | 'typed_invalid_input_counterexample'
  | 'source_grounded_rejection' | 'duplicate_collision_key_correlation' | 'distinct_duplicate_source_locations'
  | 'pairwise_distinct_duplicate_locations' | 'coordinate_derived_occurrence_key' | 'evidence_occurrence_location_correlation'
  | 'input_bound_source_occurrence';

export type RequestTypeDerivationLawObligation = Readonly<{
  readonly domain: 'source_identity' | 'request_resolution' | 'contribution' | 'closure' | 'authority' | 'input_rejection';
  readonly requiredWitness: RequestTypeDerivationLawWitnessKind;
}>;

/** Every canonical law has one explicit proof obligation owned by upstream. */
export const REQUEST_TYPE_DERIVATION_LAW_OBLIGATIONS = Object.freeze({
  route_has_explicit_request_binding: { domain: 'request_resolution', requiredWitness: 'route_disposition_binding_evidence' },
  request_identity_exact_match: { domain: 'request_resolution', requiredWitness: 'exact_request_identity_match' },
  request_identity_normalized_unique_match: { domain: 'request_resolution', requiredWitness: 'unique_normalized_request_match' },
  ambiguous_identity_is_conflict: { domain: 'request_resolution', requiredWitness: 'ambiguous_identity_conflict' },
  resource_identity_is_canonical: { domain: 'source_identity', requiredWitness: 'canonical_resource_identity' },
  route_contributes_action: { domain: 'contribution', requiredWitness: 'action_contribution_receipt' },
  route_contributes_response: { domain: 'contribution', requiredWitness: 'response_contribution_receipt' },
  group_contributions_are_reconciled: { domain: 'contribution', requiredWitness: 'group_contribution_reconciliation' },
  every_source_has_a_disposition: { domain: 'closure', requiredWitness: 'complete_source_disposition' },
  evidence_key_matches_source_domain: { domain: 'source_identity', requiredWitness: 'source_domain_key_correlation' },
  source_evidence_inventory_matches_input: { domain: 'source_identity', requiredWitness: 'input_inventory_correlation' },
  framework_request_binding_is_accounted_exclusion: { domain: 'request_resolution', requiredWitness: 'framework_binding_exclusion' },
  request_binding_kind_matches_route_disposition: { domain: 'request_resolution', requiredWitness: 'binding_kind_disposition_correlation' },
  every_group_contribution_has_receipt: { domain: 'contribution', requiredWitness: 'group_contribution_receipt_coverage' },
  judgment_closure_matches_source_ledger: { domain: 'closure', requiredWitness: 'source_ledger_closure' },
  group_receipt_matches_judgment_output: { domain: 'contribution', requiredWitness: 'receipt_judgment_output_correlation' },
  contributed_route_has_resolved_resource: { domain: 'contribution', requiredWitness: 'contributed_route_resource_resolution' },
  contribution_transition_is_contiguous: { domain: 'contribution', requiredWitness: 'contiguous_contribution_transition' },
  contribution_transition_matches_policy: { domain: 'contribution', requiredWitness: 'policy_contribution_transition' },
  group_result_matches_final_transition: { domain: 'contribution', requiredWitness: 'final_group_transition_correlation' },
  group_key_matches_resource_identity: { domain: 'source_identity', requiredWitness: 'canonical_group_resource_identity' },
  judgment_kind_matches_closure: { domain: 'closure', requiredWitness: 'judgment_closure_correlation' },
  judgment_payload_matches_proof_ledger: { domain: 'closure', requiredWitness: 'judgment_proof_ledger_correlation' },
  incomplete_judgment_matches_unresolved_ledger: { domain: 'closure', requiredWitness: 'incomplete_unresolved_ledger_correlation' },
  conflict_judgment_matches_conflict_ledger: { domain: 'closure', requiredWitness: 'conflict_ledger_correlation' },
  authority_policy_matches_contract: { domain: 'authority', requiredWitness: 'authority_contract_policy_correlation' },
  invalid_input_requires_typed_counterexample: { domain: 'input_rejection', requiredWitness: 'typed_invalid_input_counterexample' },
  input_rejection_matches_source_evidence: { domain: 'input_rejection', requiredWitness: 'source_grounded_rejection' },
  duplicate_occurrences_match_collision_key: { domain: 'source_identity', requiredWitness: 'duplicate_collision_key_correlation' },
  duplicate_occurrences_are_distinct_source_locations: { domain: 'source_identity', requiredWitness: 'distinct_duplicate_source_locations' },
  all_duplicate_occurrence_locations_are_pairwise_distinct: { domain: 'source_identity', requiredWitness: 'pairwise_distinct_duplicate_locations' },
  source_occurrence_key_matches_source_coordinates: { domain: 'source_identity', requiredWitness: 'coordinate_derived_occurrence_key' },
  source_occurrence_location_matches_evidence: { domain: 'source_identity', requiredWitness: 'evidence_occurrence_location_correlation' },
  source_occurrence_belongs_to_input: { domain: 'source_identity', requiredWitness: 'input_bound_source_occurrence' },
} satisfies Readonly<Record<RequestTypeDerivationLawId, RequestTypeDerivationLawObligation>>);

/**
 * Coverage is keyed by the complete law union. Unlike a readonly array, this
 * mapped type cannot omit a law without violating the interface contract.
 */
export type RequestTypeDerivationRequiredLawCoverage = Readonly<
  Record<RequestTypeDerivationLawId, 'required'>
>;

/** A closed proof must account for every law, not merely name a selected subset. */
export type RequestTypeDerivationVerifiedLawCoverage = Readonly<
  Record<RequestTypeDerivationLawId, 'verified'>
>;

/** These are semantic laws, not an imperative list of runtime stages. */
export interface RequestTypeDerivationPolicy {
  readonly requestResolution: Readonly<{
    readonly kind: 'exact_then_normalized_unique';
    readonly exactMatchDominatesNormalizedMatch: true;
    readonly exactAmbiguity: 'conflict';
    readonly normalizedAmbiguity: 'conflict';
    readonly missing: 'incomplete_judgment';
  }>;
  readonly resourceIdentity: Readonly<{
    readonly kind: 'canonical_case_insensitive_identity';
    readonly duplicateIdentity: 'conflict';
    readonly missingIdentity: 'incomplete_judgment';
  }>;
  readonly groupIdentity: Readonly<{
    readonly kind: 'canonical_resource_identity';
    readonly collision: 'conflict';
  }>;
  readonly actionContribution: Readonly<{
    readonly kind: 'merge_by_action_name';
    readonly absent: 'append';
    readonly existingEmptyOrIncomingFieldful: 'replace_existing';
    readonly otherwise: 'retain_existing';
  }>;
  readonly responseContribution: Readonly<{
    readonly kind: 'merge_response';
    readonly existingAbsentOrEmpty: 'accept_incoming';
    readonly existingNonempty: 'retain_existing';
  }>;
  readonly groupContribution: Readonly<{
    readonly initialGroup: 'before_absent_after_equals_initial_result';
    readonly mergeGroup: 'before_present_after_equals_policy_merge';
    readonly chain: 'each_before_equals_previous_after';
    readonly finalOutput: 'equals_last_after';
  }>;
  readonly outcomeCoherence: Readonly<{
    readonly derived: 'closed_with_empty_conflict_ledger';
    readonly incomplete: 'incomplete_with_nonempty_unresolved_ledger';
    readonly conflict: 'conflicted_with_nonempty_conflict_ledger';
    readonly judgmentGroups: 'equal_group_receipt_results';
    readonly proofLedgers: 'judgment_ledgers_equal_proof_ledgers';
  }>;
  readonly closure: Readonly<{
    readonly everyRouteHasDisposition: true;
    readonly everyResourceHasDisposition: true;
    readonly everyRequestHasDisposition: true;
    readonly unresolvedEvidence: 'incomplete_judgment';
    readonly semanticConflict: 'conflict_judgment';
    readonly explicitNoRequestBinding: 'accounted_exclusion';
    /** Framework-owned requests are distinct from an explicit absence of request binding. */
    readonly frameworkRequestBinding: 'accounted_exclusion';
  }>;
}

/** Input is source evidence. It is not a pre-classified RequestType result. */
export interface RequestTypeDerivationInput {
  readonly routes: readonly RouteSemanticFlow[];
  readonly resources: readonly ResourceAst[];
  readonly requests: readonly RequestAst[];
}

/** Canonical upstream operation that preserves source identity and exact occurrence coordinates. */
export interface RequestTypeDerivationSourceEvidenceInventoryInterface {
  readonly canonicalRouteIdentity: (identity: RouteSemanticFlow['identity']) => RequestTypeCanonicalRouteIdentity;
  readonly canonicalResourceIdentity: (identity: ResourceAst['definition']['name']) => RequestTypeCanonicalResourceIdentity;
  readonly canonicalRequestIdentity: (identity: RequestAst['definition']['identity']) => RequestTypeCanonicalRequestIdentity;
  /** Return a typed relation judgment; serialized keys are not identity authority. */
  readonly relateCanonicalRouteIdentity: (
    left: RequestTypeCanonicalRouteIdentity,
    right: RequestTypeCanonicalRouteIdentity,
  ) => RequestTypeCanonicalRouteIdentityRelationJudgment;
  /** Return a typed relation judgment; serialized keys are not identity authority. */
  readonly relateCanonicalResourceIdentity: (
    left: RequestTypeCanonicalResourceIdentity,
    right: RequestTypeCanonicalResourceIdentity,
  ) => RequestTypeCanonicalResourceIdentityRelationJudgment;
  /** Return a typed relation judgment; serialized keys are not identity authority. */
  readonly relateCanonicalRequestIdentity: (
    left: RequestTypeCanonicalRequestIdentity,
    right: RequestTypeCanonicalRequestIdentity,
  ) => RequestTypeCanonicalRequestIdentityRelationJudgment;
  /** Canonical occurrence operations: semantic identity and source location are separate domains. */
  readonly canonicalRouteOccurrenceKey: (provenance: RouteSemanticFlow['provenance']) => RequestTypeRouteOccurrenceKey;
  readonly canonicalResourceOccurrenceKey: (source: ResourceAst['source']) => RequestTypeResourceOccurrenceKey;
  readonly canonicalRequestOccurrenceKey: (source: RequestAst['source']) => RequestTypeRequestOccurrenceKey;
  readonly inventory: (input: RequestTypeDerivationInput) => Readonly<{
    readonly routes: readonly RequestTypeRouteEvidenceReference[];
    readonly resources: readonly RequestTypeResourceEvidenceReference[];
    readonly requests: readonly RequestTypeRequestEvidenceReference[];
  }>;
  /** Detect repeated canonical identities without collapsing distinct source occurrences. */
  readonly duplicateIdentityWitnesses: (input: RequestTypeDerivationInput) => readonly RequestTypeDuplicateIdentityWitness[];
  /** Return the collision state as a closed ADT owned by the canonical identity inventory. */
  readonly identityCollisionInventory: (input: RequestTypeDerivationInput) => RequestTypeDerivationIdentityCollisionInventory;
  /** Project the canonical inventory into its semantic-key ledger for inventory laws. */
  readonly evidenceKeys: (input: RequestTypeDerivationInput) => readonly RequestTypeEvidenceKey[];
}

/** Closed identity judgments preserve domain meaning instead of exposing loose string keys. */
export type RequestTypeCanonicalRouteIdentity = Readonly<{
  readonly kind: 'canonical_route_identity';
  /** Structural domain identity is authoritative; semanticKey is a serialized ledger projection. */
  readonly coordinates: Pick<RouteSemanticFlow['identity']['coordinates'], 'method' | 'path' | 'name'>;
  readonly domain: Pick<RouteSemanticFlow['identity']['domain'], 'resource' | 'domain' | 'group'>;
  readonly routeName: RouteSemanticFlow['identity']['coordinates']['name'];
  readonly semanticKey: RequestTypeRouteEvidenceKey;
}>;

export type RequestTypeCanonicalResourceIdentity = Readonly<{
  readonly kind: 'canonical_resource_identity';
  readonly canonicalName: ResourceAst['definition']['name'];
  readonly semanticKey: RequestTypeResourceEvidenceKey;
}>;

export type RequestTypeCanonicalRequestIdentity =
  | Readonly<{
      readonly kind: 'canonical_request_identity';
      readonly identityKind: 'http_request_identity';
      readonly requestName: Extract<RequestAst['definition']['identity'], { readonly kind: 'http_request_identity' }>['request'];
      readonly semanticKey: RequestTypeRequestEvidenceKey;
    }>
  | Readonly<{
      readonly kind: 'canonical_request_identity';
      readonly identityKind: 'form_request_identity';
      readonly requestName: Extract<RequestAst['definition']['identity'], { readonly kind: 'form_request_identity' }>['request'];
      readonly formType: Extract<RequestAst['definition']['identity'], { readonly kind: 'form_request_identity' }>['formType'];
      readonly semanticKey: RequestTypeRequestEvidenceKey;
    }>;

export type RequestTypeCanonicalIdentity =
  | RequestTypeCanonicalRouteIdentity
  | RequestTypeCanonicalResourceIdentity
  | RequestTypeCanonicalRequestIdentity;

/** Identity relations preserve the decision and both operands as semantic evidence. */
export type RequestTypeCanonicalRouteIdentityRelationJudgment =
  | Readonly<{ readonly kind: 'canonical_route_identity_equivalent'; readonly left: RequestTypeCanonicalRouteIdentity; readonly right: RequestTypeCanonicalRouteIdentity }>
  | Readonly<{ readonly kind: 'canonical_route_identity_distinct'; readonly left: RequestTypeCanonicalRouteIdentity; readonly right: RequestTypeCanonicalRouteIdentity }>;

export type RequestTypeCanonicalResourceIdentityRelationJudgment =
  | Readonly<{ readonly kind: 'canonical_resource_identity_equivalent'; readonly left: RequestTypeCanonicalResourceIdentity; readonly right: RequestTypeCanonicalResourceIdentity }>
  | Readonly<{ readonly kind: 'canonical_resource_identity_distinct'; readonly left: RequestTypeCanonicalResourceIdentity; readonly right: RequestTypeCanonicalResourceIdentity }>;

export type RequestTypeCanonicalRequestIdentityRelationJudgment =
  | Readonly<{ readonly kind: 'canonical_request_identity_equivalent'; readonly left: RequestTypeCanonicalRequestIdentity; readonly right: RequestTypeCanonicalRequestIdentity }>
  | Readonly<{ readonly kind: 'canonical_request_identity_distinct'; readonly left: RequestTypeCanonicalRequestIdentity; readonly right: RequestTypeCanonicalRequestIdentity }>;

export type RequestTypeSourceEvidenceIdentity =
  | Readonly<{
      readonly kind: 'route';
      readonly identity: RouteSemanticFlow['identity'];
      readonly provenance: RouteSemanticFlow['provenance'];
    }>
  | Readonly<{
      readonly kind: 'resource';
      readonly identity: ResourceAst['definition']['name'];
      readonly source: ResourceAst['source'];
    }>
  | Readonly<{
      readonly kind: 'request';
      readonly identity: RequestAst['definition']['identity'];
      readonly source: RequestAst['source'];
    }>;

export type RequestTypeEvidenceKey =
  | `route:${string}`
  | `resource:${string}`
  | `request:${string}`;

/**
 * A source occurrence key identifies a declaration location, not its semantic identity.
 * It must be stable from source coordinates and must not be minted from traversal order
 * or object identity. This distinction lets duplicate semantic keys retain distinct origins.
 */
export type RequestTypeSourceOccurrenceKey =
  | `route-occurrence:${string}`
  | `resource-occurrence:${string}`
  | `request-occurrence:${string}`;

/**
 * Structural source location carried alongside the stable occurrence key.
 * Route flows carry the original declaration span alongside file + line provenance.
 * The authority must establish that this location agrees with the canonical source evidence.
 */
export type RequestTypeSourceOccurrenceLocation =
  | Readonly<{
      readonly kind: 'route_declaration_location';
      readonly file: RouteSemanticFlow['provenance']['sourceFile'];
      readonly line: RouteSemanticFlow['provenance']['sourceLine'];
      readonly span: RouteSemanticFlow['provenance']['declarationSpan'];
    }>
  | Readonly<{
      readonly kind: 'source_span_location';
      readonly span: import('./provenance').SourceSpan;
    }>;

export type RequestTypeRouteOccurrenceLocation = Extract<RequestTypeSourceOccurrenceLocation, { readonly kind: 'route_declaration_location' }>;
export type RequestTypeResourceOccurrenceLocation = Extract<RequestTypeSourceOccurrenceLocation, { readonly kind: 'source_span_location' }>;
export type RequestTypeRequestOccurrenceLocation = Extract<RequestTypeSourceOccurrenceLocation, { readonly kind: 'source_span_location' }>;
export type RequestTypeRouteOccurrenceKey = `route-occurrence:${string}`;
export type RequestTypeResourceOccurrenceKey = `resource-occurrence:${string}`;
export type RequestTypeRequestOccurrenceKey = `request-occurrence:${string}`;

/** Group keys are domain-separated from route/request keys and use canonical resource identity. */
export type RequestTypeGroupKey = `resource:${string}`;

export type RequestTypeEvidenceReference =
  | Readonly<{
      /** The key prefix is correlated with the source domain, not just a free union. */
      readonly source: Extract<RequestTypeSourceEvidenceIdentity, { readonly kind: 'route' }>;
      readonly semanticKey: `route:${string}`;
      readonly canonicalIdentity: RequestTypeCanonicalRouteIdentity;
      /** Stable source-coordinate identity, independent from the colliding route identity. */
      readonly occurrenceKey: RequestTypeRouteOccurrenceKey;
      readonly location: RequestTypeRouteOccurrenceLocation;
    }>
  | Readonly<{
      readonly source: Extract<RequestTypeSourceEvidenceIdentity, { readonly kind: 'resource' }>;
      readonly semanticKey: `resource:${string}`;
      readonly canonicalIdentity: RequestTypeCanonicalResourceIdentity;
      /** Stable source-span identity, independent from the colliding resource identity. */
      readonly occurrenceKey: RequestTypeResourceOccurrenceKey;
      readonly location: RequestTypeResourceOccurrenceLocation;
    }>
  | Readonly<{
      readonly source: Extract<RequestTypeSourceEvidenceIdentity, { readonly kind: 'request' }>;
      readonly semanticKey: `request:${string}`;
      readonly canonicalIdentity: RequestTypeCanonicalRequestIdentity;
      /** Stable source-span identity, independent from the colliding request identity. */
      readonly occurrenceKey: RequestTypeRequestOccurrenceKey;
      readonly location: RequestTypeRequestOccurrenceLocation;
    }>;

export type RequestTypeRouteEvidenceKey = `route:${string}`;
export type RequestTypeResourceEvidenceKey = `resource:${string}`;
export type RequestTypeRequestEvidenceKey = `request:${string}`;
export type RequestTypeRouteEvidenceReference = Extract<RequestTypeEvidenceReference, { readonly semanticKey: RequestTypeRouteEvidenceKey }>;
export type RequestTypeResourceEvidenceReference = Extract<RequestTypeEvidenceReference, { readonly semanticKey: RequestTypeResourceEvidenceKey }>;
export type RequestTypeRequestEvidenceReference = Extract<RequestTypeEvidenceReference, { readonly semanticKey: RequestTypeRequestEvidenceKey }>; 

export type RequestTypeRequestCandidateSelection =
  | Readonly<{ readonly kind: 'none' }>
  | Readonly<{ readonly kind: 'one'; readonly candidate: RequestTypeRequestEvidenceReference }>
  | Readonly<{
      readonly kind: 'many';
      readonly first: RequestTypeRequestEvidenceReference;
      readonly second: RequestTypeRequestEvidenceReference;
      readonly remaining: readonly RequestTypeRequestEvidenceReference[];
    }>;

/** Explicit cardinality operation used by request resolution; no first-item fallback. */
export interface RequestTypeRequestCandidateSelectionInterface {
  readonly select: (
    candidates: readonly RequestTypeRequestEvidenceReference[],
  ) => RequestTypeRequestCandidateSelection;
}

export type RequestTypeRequestResolution =
  | Readonly<{ readonly kind: 'resolved_exact'; readonly request: RequestTypeRequestEvidenceReference }>
  | Readonly<{ readonly kind: 'resolved_normalized'; readonly request: RequestTypeRequestEvidenceReference }>
  | Readonly<{ readonly kind: 'missing'; readonly query: string }>
  | Readonly<{ readonly kind: 'ambiguous_exact'; readonly candidates: readonly RequestTypeRequestEvidenceReference[] }>
  | Readonly<{ readonly kind: 'ambiguous_normalized'; readonly candidates: readonly RequestTypeRequestEvidenceReference[] }>;

export type RequestTypeResourceResolution =
  | Readonly<{ readonly kind: 'resolved'; readonly resource: RequestTypeResourceEvidenceReference }>
  | Readonly<{ readonly kind: 'missing'; readonly query: string }>
  | Readonly<{ readonly kind: 'ambiguous'; readonly candidates: readonly RequestTypeResourceEvidenceReference[] }>
  | Readonly<{
      readonly kind: 'identity_mismatch';
      readonly routeResourceName: RouteSemanticFlow['identity']['domain']['resource'];
      readonly bindingResourceName: Extract<RouteSemanticFlow['binding']['request'], { readonly kind: 'form_request' }>['identity']['resource'];
    }>;

/** Closed cardinality for canonical resource candidates; no first-candidate fallback. */
export type RequestTypeResourceCandidateSelection =
  | Readonly<{ readonly kind: 'none' }>
  | Readonly<{ readonly kind: 'one'; readonly candidate: RequestTypeResourceEvidenceReference }>
  | Readonly<{ readonly kind: 'many'; readonly first: RequestTypeResourceEvidenceReference; readonly second: RequestTypeResourceEvidenceReference; readonly remaining: readonly RequestTypeResourceEvidenceReference[] }>;

export interface RequestTypeResourceCandidateSelectionInterface {
  readonly select: (candidates: readonly RequestTypeResourceEvidenceReference[]) => RequestTypeResourceCandidateSelection;
}

/** Named input contract for canonical resource resolution. */
export type RequestTypeDerivationResourceResolutionInput = Readonly<{
  readonly resourceName: RouteSemanticFlow['identity']['domain']['resource'];
  readonly resources: readonly RequestTypeResourceEvidenceReference[];
}>;

/** Resolves a route's resource name using the canonical upstream resource identity. */
export interface RequestTypeDerivationResourceResolutionInterface {
  readonly resolve: (input: RequestTypeDerivationResourceResolutionInput) => RequestTypeResourceResolution;
}

export type RequestTypeRouteResourceResolutionReceipt = Readonly<{
  readonly route: RequestTypeRouteEvidenceReference;
  readonly resourceName: RouteSemanticFlow['identity']['domain']['resource'];
  readonly resolution: RequestTypeResourceResolution | Readonly<{ readonly kind: 'not_required' }>;
}>;

export type RequestTypeRouteResourceResolutionInventoryInput = RequestTypeDerivationInput & Readonly<{
  readonly inventory: Readonly<{
    readonly routes: readonly RequestTypeRouteEvidenceReference[];
    readonly resources: readonly RequestTypeResourceEvidenceReference[];
  }>;
}>;

export interface RequestTypeRouteResourceResolutionInventoryInterface {
  readonly resolve: (input: RequestTypeRouteResourceResolutionInventoryInput) => readonly RequestTypeRouteResourceResolutionReceipt[];
}

export type RequestTypeResourceConflictReceipt = RequestTypeRouteResourceResolutionReceipt & Readonly<{
  readonly resolution: Extract<RequestTypeResourceResolution, { readonly kind: 'ambiguous' | 'identity_mismatch' }>;
}>;

export type RequestTypeResourceResolutionAssessment =
  | Readonly<{ readonly kind: 'resolved'; readonly ledger: readonly RequestTypeRouteResourceResolutionReceipt[] }>
  | Readonly<{ readonly kind: 'incomplete'; readonly ledger: readonly RequestTypeRouteResourceResolutionReceipt[]; readonly missing: readonly RequestTypeRouteResourceResolutionReceipt[] }>
  | Readonly<{ readonly kind: 'conflict'; readonly ledger: readonly RequestTypeRouteResourceResolutionReceipt[]; readonly conflicts: readonly RequestTypeResourceConflictReceipt[] }>
  | Readonly<{ readonly kind: 'incomplete_and_conflicted'; readonly ledger: readonly RequestTypeRouteResourceResolutionReceipt[]; readonly missing: readonly RequestTypeRouteResourceResolutionReceipt[]; readonly conflicts: readonly RequestTypeResourceConflictReceipt[] }>;

export interface RequestTypeResourceResolutionAssessmentInterface {
  readonly assess: (ledger: readonly RequestTypeRouteResourceResolutionReceipt[]) => RequestTypeResourceResolutionAssessment;
}

/**
 * Complete source-bound preparation packet for the manifest semantic path.
 * It records inventory and resolution evidence only; it is not a semantic
 * judgment and must not be treated as proof that derivation laws are verified.
 */
export type RequestTypeDerivationIdentityCollisionInventory =
  | Readonly<{ readonly kind: 'identity_inventory_collision_free' }>
  | Readonly<{ readonly kind: 'identity_inventory_collisions'; readonly witnesses: RequestTypeNonEmptyLedger<RequestTypeDuplicateIdentityWitness> }>;

export type RequestTypeDerivationSemanticInputPreparation<
  TInput extends RequestTypeDerivationInput = RequestTypeDerivationInput,
> = TInput & Readonly<{
  readonly kind: 'request_type_derivation_semantic_input_preparation';
  /** Exact raw input that produced this preparation packet. */
  readonly input: TInput;
  readonly inventory: Readonly<{
    readonly routes: readonly RequestTypeRouteEvidenceReference[];
    readonly resources: readonly RequestTypeResourceEvidenceReference[];
    readonly requests: readonly RequestTypeRequestEvidenceReference[];
  }>;
  readonly sourceEvidence: readonly RequestTypeEvidenceReference[];
  readonly identityCollisionInventory: RequestTypeDerivationIdentityCollisionInventory;
  readonly requestResolutionLedger: readonly RequestTypeRouteRequestResolutionReceipt[];
  readonly requestAssessment: RequestTypeRequestResolutionAssessment;
  readonly resourceResolutionLedger: readonly RequestTypeRouteResourceResolutionReceipt[];
  readonly resourceAssessment: RequestTypeResourceResolutionAssessment;
}>;

/** Semantic owner for preparing source inventory and resolution ledgers. */
export interface RequestTypeDerivationSemanticInputPreparationInterface<
  TInput extends RequestTypeDerivationInput = RequestTypeDerivationInput,
> {
  readonly prepare: (input: TInput) => RequestTypeDerivationSemanticInputPreparation<TInput>;
}

/** Explicit upstream operation for resolving a route's typed request binding. */
export interface RequestTypeDerivationRequestResolutionInterface {
  readonly resolve: (input: Readonly<{
    readonly requestClass: Extract<RouteSemanticFlow['binding']['request'], { readonly kind: 'form_request' }>['identity']['source']['requestClass'];
    readonly requests: readonly RequestTypeRequestEvidenceReference[];
  }>) => RequestTypeRequestResolution;
}

/** Resolution ledger entry retained at the active manifest projection boundary. */
export type RequestTypeRouteRequestResolutionResult = RequestTypeRequestResolution
  | Readonly<{ readonly kind: 'not_required' }>
  | Readonly<{ readonly kind: 'unresolved_binding'; readonly reason: 'unresolved_request' | 'unresolved_action_request' }>;

export type RequestTypeRouteRequestResolutionReceipt = Readonly<{
  readonly route: RequestTypeRouteEvidenceReference;
  readonly bindingKind: RouteSemanticFlow['binding']['request']['kind'];
  readonly resolution: RequestTypeRouteRequestResolutionResult;
}>;

/** Compiler-owned implementation contract for recording every route's request-resolution outcome. */
export interface RequestTypeRouteRequestResolutionInventoryInterface {
  readonly resolve: (input: RequestTypeDerivationInput & Readonly<{
    readonly inventory: Readonly<{ readonly routes: readonly RequestTypeRouteEvidenceReference[]; readonly requests: readonly RequestTypeRequestEvidenceReference[] }>;
  }>) => readonly RequestTypeRouteRequestResolutionReceipt[];
}

/** A missing explicit Form Request or unresolved binding is incomplete; ambiguity is a conflict. */
export type RequestTypeMissingResolutionReceipt = RequestTypeRouteRequestResolutionReceipt & Readonly<{
  readonly resolution: Extract<RequestTypeRequestResolution, { readonly kind: 'missing' }>;
}>;

export type RequestTypeUnresolvedBindingReceipt = RequestTypeRouteRequestResolutionReceipt & Readonly<{
  readonly resolution: Extract<RequestTypeRouteRequestResolutionResult, { readonly kind: 'unresolved_binding' }>;
}>;

export type RequestTypeAmbiguousResolutionReceipt = RequestTypeRouteRequestResolutionReceipt & Readonly<{
  readonly resolution: Extract<RequestTypeRequestResolution, { readonly kind: 'ambiguous_exact' | 'ambiguous_normalized' }>;
}>;

export type RequestTypeIncompleteResolutionIssue =
  | Readonly<{ readonly kind: 'missing_request'; readonly receipt: RequestTypeMissingResolutionReceipt }>
  | Readonly<{ readonly kind: 'unresolved_binding'; readonly receipt: RequestTypeUnresolvedBindingReceipt }>;

/** Closed assessment for the active CLI projection boundary; this is not a proof judgment. */
export type RequestTypeRequestResolutionAssessment =
  | Readonly<{
      readonly kind: 'resolved';
      readonly ledger: readonly RequestTypeRouteRequestResolutionReceipt[];
    }>
  | Readonly<{
      readonly kind: 'incomplete';
      readonly ledger: readonly RequestTypeRouteRequestResolutionReceipt[];
      readonly issues: readonly RequestTypeIncompleteResolutionIssue[];
    }>
  | Readonly<{
      readonly kind: 'conflict';
      readonly ledger: readonly RequestTypeRouteRequestResolutionReceipt[];
      readonly ambiguous: readonly RequestTypeAmbiguousResolutionReceipt[];
    }>
  | Readonly<{
      readonly kind: 'incomplete_and_conflicted';
      readonly ledger: readonly RequestTypeRouteRequestResolutionReceipt[];
      readonly issues: readonly RequestTypeIncompleteResolutionIssue[];
      readonly ambiguous: readonly RequestTypeAmbiguousResolutionReceipt[];
    }>;

/** Classifies resolution-ledger closure without inventing a semantic judgment or proof. */
export interface RequestTypeRequestResolutionAssessmentInterface {
  readonly assess: (ledger: readonly RequestTypeRouteRequestResolutionReceipt[]) => RequestTypeRequestResolutionAssessment;
}

export type RequestTypeRouteDisposition =
  | Readonly<{ readonly kind: 'accounted_exclusion'; readonly reason: 'no_request_binding' | 'framework_request_binding' }>
  | Readonly<{
      readonly kind: 'contributed';
      readonly groupKey: RequestTypeGroupKey;
      readonly request: RequestTypeRequestEvidenceReference;
      readonly resource: RequestTypeResourceEvidenceReference;
    }>
  | Readonly<{ readonly kind: 'unresolved'; readonly reason: 'request_missing' | 'resource_missing' }>
  | Readonly<{ readonly kind: 'conflicted'; readonly reason: 'duplicate_route_identity' | 'ambiguous_request' | 'ambiguous_resource' | 'resource_identity_mismatch' | 'incompatible_group_contribution' }>;

export interface RequestTypeRouteReceipt {
  readonly route: RequestTypeRouteEvidenceReference;
  /** Preserves the source ADT distinction instead of collapsing all non-FormRequest bindings. */
  readonly requestBindingKind: RouteSemanticFlow['binding']['request']['kind'];
  readonly requestResolution: RequestTypeRouteRequestResolutionResult;
  readonly resourceResolution: RequestTypeResourceResolution | Readonly<{ readonly kind: 'not_required' }>;
  readonly disposition: RequestTypeRouteDisposition;
  readonly appliedLaws: readonly RequestTypeDerivationLawId[];
}

export type RequestTypeResourceDisposition =
  | Readonly<{ readonly kind: 'available'; readonly canonicalKey: RequestTypeGroupKey }>
  | Readonly<{ readonly kind: 'unused'; readonly canonicalKey: RequestTypeGroupKey }>
  | Readonly<{ readonly kind: 'conflicted'; readonly reason: 'duplicate_canonical_identity' }>;

export interface RequestTypeResourceReceipt {
  readonly resource: RequestTypeResourceEvidenceReference;
  readonly disposition: RequestTypeResourceDisposition;
}

export type RequestTypeRequestDisposition =
  | Readonly<{ readonly kind: 'matched'; readonly routeReferences: readonly RequestTypeRouteEvidenceReference[] }>
  | Readonly<{ readonly kind: 'unused' }>
  | Readonly<{ readonly kind: 'conflicted'; readonly reason: 'duplicate_exact_identity' | 'duplicate_normalized_identity' }>;

export interface RequestTypeRequestReceipt {
  readonly request: RequestTypeRequestEvidenceReference;
  readonly disposition: RequestTypeRequestDisposition;
}

export type RequestTypeActionContributionReceipt =
  | Readonly<{ readonly kind: 'not_applicable' }>
  | Readonly<{ readonly kind: 'appended' | 'replaced_existing' | 'retained_existing'; readonly actionName: RequestType['actions'][number]['name'] }>;

export type RequestTypeResponseContributionReceipt =
  | Readonly<{ readonly kind: 'no_incoming_response' }>
  | Readonly<{ readonly kind: 'accepted_incoming' }>
  | Readonly<{ readonly kind: 'retained_existing' }>;

/** Records how each route changed (or did not change) the semantic group result. */
export interface RequestTypeGroupContributionReceipt {
  readonly route: RequestTypeRouteEvidenceReference;
  readonly request: RequestTypeRequestEvidenceReference;
  /** Makes first contribution and subsequent fold transitions semantically distinct. */
  readonly transition: 'initial_group' | 'merge_existing_group';
  readonly action: RequestTypeActionContributionReceipt;
  readonly response: RequestTypeResponseContributionReceipt;
  /** Complete states make each contribution replayable and independently verifiable. */
  readonly before: RequestType | Readonly<{ readonly kind: 'group_absent' }>;
  /**
   * Full incoming semantic value, including identity and source provenance.
   * A projected actions/response pair is insufficient: it lets a forged receipt
   * replay while detaching the contribution from the AST occurrence that claims it.
   */
  readonly incoming: RequestType;
  readonly after: RequestType;
}

/** Input to the canonical immutable action/response group-fold algebra. */
export interface RequestTypeGroupFoldInput {
  readonly canonicalKey: RequestTypeGroupKey;
  readonly route: RequestTypeRouteEvidenceReference;
  readonly request: RequestTypeRequestEvidenceReference;
  readonly before: RequestType | Readonly<{ readonly kind: 'group_absent' }>;
  readonly incoming: RequestType;
}

/** Upstream owns contribution policy; producers cannot reimplement merge rules locally. */
export interface RequestTypeGroupContributionAlgebraInterface {
  readonly fold: (input: RequestTypeGroupFoldInput) => RequestTypeGroupContributionReceipt;
}

export interface RequestTypeGroupReceipt {
  readonly canonicalKey: RequestTypeGroupKey;
  readonly contributingRoutes: readonly RequestTypeRouteEvidenceReference[];
  readonly contributingRequests: readonly RequestTypeRequestEvidenceReference[];
  /** One receipt per contribution, so membership alone cannot masquerade as a derivation proof. */
  readonly contributions: readonly RequestTypeGroupContributionReceipt[];
  /** Exact semantic output attested by this receipt; identity alone cannot prove its actions/response. */
  readonly result: RequestType;
  readonly resultIdentity: RequestType['identity'];
}

/**
 * Closure is a semantic judgment over all three source domains. A route-only
 * count is insufficient because unused/duplicate resources and requests also
 * affect whether the source model has been accounted for.
 */
export type RequestTypeDerivationClosure =
  | Readonly<{
      readonly kind: 'closed';
      readonly routes: Readonly<{ readonly expected: number; readonly accounted: number }>;
      readonly resources: Readonly<{ readonly expected: number; readonly accounted: number }>;
      readonly requests: Readonly<{ readonly expected: number; readonly accounted: number }>;
      readonly unresolved: 0;
      readonly conflicts: 0;
    }>
  | Readonly<{
      readonly kind: 'incomplete';
      readonly routes: Readonly<{ readonly expected: number; readonly accounted: number }>;
      readonly resources: Readonly<{ readonly expected: number; readonly accounted: number }>;
      readonly requests: Readonly<{ readonly expected: number; readonly accounted: number }>;
      readonly unresolved: number;
      readonly conflicts: 0;
    }>
  | Readonly<{
      readonly kind: 'conflicted';
      readonly routes: Readonly<{ readonly expected: number; readonly accounted: number }>;
      readonly resources: Readonly<{ readonly expected: number; readonly accounted: number }>;
      readonly requests: Readonly<{ readonly expected: number; readonly accounted: number }>;
      readonly unresolved: number;
      readonly conflicts: number;
    }>;

/** Relation facts make the derivation inspectable without prescribing executor control flow. */
export type RequestTypeDerivationRelation =
  | Readonly<{ readonly relation: 'route_disposition'; readonly routeKey: RequestTypeRouteEvidenceKey; readonly disposition: RequestTypeRouteDisposition['kind'] }>
  | Readonly<{ readonly relation: 'request_resolves_to'; readonly routeKey: RequestTypeRouteEvidenceKey; readonly requestKey: RequestTypeRequestEvidenceKey; readonly mode: 'exact' | 'normalized' }>
  | Readonly<{ readonly relation: 'route_groups_by'; readonly routeKey: RequestTypeRouteEvidenceKey; readonly groupKey: RequestTypeGroupKey }>
  | Readonly<{ readonly relation: 'resource_available_as'; readonly resourceKey: RequestTypeResourceEvidenceKey; readonly canonicalKey: RequestTypeGroupKey }>
  | Readonly<{ readonly relation: 'group_contains_route'; readonly groupKey: RequestTypeGroupKey; readonly routeKey: RequestTypeRouteEvidenceKey }>
  | Readonly<{ readonly relation: 'source_conflict'; readonly sourceKey: RequestTypeEvidenceKey; readonly conflictKind: RequestTypeDerivationConflict['kind'] }>;

export interface RequestTypeDerivationProof {
  readonly kind: 'request_type_derivation_proof';
  readonly authority: 'upstream_request_type_derivation';
  readonly reasoning: 'declarative_source_relation_closure';
  readonly policy: RequestTypeDerivationPolicy;
  /**
   * The producer records which canonical obligations govern this evidence.
   * This is deliberately NOT verified-law coverage: only the independent
   * verifier may return `RequestTypeDerivationVerifiedLawCoverage`. Keeping
   * those two claims separate prevents a producer from self-certifying its
   * own proof before verification has run.
   */
  readonly requiredLaws: RequestTypeDerivationRequiredLawCoverage;
  readonly sourceEvidence: Readonly<{
    readonly routes: readonly RequestTypeRouteEvidenceReference[];
    readonly resources: readonly RequestTypeResourceEvidenceReference[];
    readonly requests: readonly RequestTypeRequestEvidenceReference[];
  }>;
  readonly routeReceipts: readonly RequestTypeRouteReceipt[];
  readonly resourceReceipts: readonly RequestTypeResourceReceipt[];
  readonly requestReceipts: readonly RequestTypeRequestReceipt[];
  readonly groupReceipts: readonly RequestTypeGroupReceipt[];
  readonly relations: readonly RequestTypeDerivationRelation[];
  readonly conflicts: readonly RequestTypeDerivationConflict[];
  readonly closure: RequestTypeDerivationClosure;
}

export type RequestTypeDerivationConflict =
  | Readonly<{ readonly kind: 'duplicate_route_identity'; readonly candidates: readonly RequestTypeRouteEvidenceReference[] }>
  | Readonly<{ readonly kind: 'duplicate_request_identity'; readonly candidates: readonly RequestTypeRequestEvidenceReference[] }>
  | Readonly<{ readonly kind: 'ambiguous_request_identity'; readonly route: RequestTypeRouteEvidenceReference; readonly candidates: readonly RequestTypeRequestEvidenceReference[] }>
  | Readonly<{ readonly kind: 'ambiguous_resource_identity'; readonly route: RequestTypeRouteEvidenceReference; readonly candidates: readonly RequestTypeResourceEvidenceReference[] }>
  | Readonly<{ readonly kind: 'resource_identity_mismatch'; readonly route: RequestTypeRouteEvidenceReference; readonly routeResourceName: RouteSemanticFlow['identity']['domain']['resource']; readonly bindingResourceName: Extract<RouteSemanticFlow['binding']['request'], { readonly kind: 'form_request' }>['identity']['resource'] }>
  | Readonly<{ readonly kind: 'duplicate_resource_identity'; readonly candidates: readonly RequestTypeResourceEvidenceReference[] }>
  | Readonly<{ readonly kind: 'incompatible_group_contribution'; readonly groupKey: RequestTypeGroupKey; readonly routeReceipts: readonly RequestTypeRouteReceipt[] }>;

/** A non-empty ledger is required whenever a judgment claims unresolved evidence or conflicts. */
export type RequestTypeNonEmptyLedger<T> = readonly [T, ...T[]];

export type RequestTypeUnresolvedRouteReceipt = Omit<RequestTypeRouteReceipt, 'disposition'> & Readonly<{
  readonly disposition: Extract<RequestTypeRouteDisposition, { readonly kind: 'unresolved' }>;
}>;

/** Couples the judgment state to the proof closure at the type boundary. */
export type RequestTypeDerivationProofFor<Kind extends RequestTypeDerivationClosure['kind']> =
  Omit<RequestTypeDerivationProof, 'closure' | 'conflicts'> & Readonly<{
    readonly closure: Extract<RequestTypeDerivationClosure, { readonly kind: Kind }>;
    readonly conflicts: Kind extends 'conflicted'
      ? RequestTypeNonEmptyLedger<RequestTypeDerivationConflict>
      : readonly [];
  }>;

/**
 * Rejected input is a first-class semantic result, not a proof-less derivation.
 * Its evidence identifies the precise source-domain or contract invariant that
 * prevented derivation, allowing verify() to validate rejection separately.
 */
/** At least two source occurrences are required to witness a duplicate identity. */
export interface RequestTypeDuplicateOccurrencePair<
  T extends Readonly<{ readonly occurrenceKey: RequestTypeSourceOccurrenceKey }>
> {
  /** The first source declaration participating in the collision. */
  readonly first: T;
  /** The second source declaration; authority must prove its occurrenceKey differs from first. */
  readonly second: T;
  /** Additional colliding declarations, if the same semantic identity occurs more than twice. */
  readonly additional: readonly T[];
}

/**
 * A duplicate witness names the colliding semantic key and the actual source
 * occurrences that claimed it. Key equality across occurrences is checked by
 * the authority under `duplicate_occurrences_match_collision_key`.
 */
/** A typed counterexample when a purported occurrence key does not identify its source coordinates. */
export type RequestTypeSourceOccurrenceKeyMismatch =
  | Readonly<{
      readonly domain: 'routes';
      readonly source: Extract<RequestTypeSourceEvidenceIdentity, { readonly kind: 'route' }>;
      readonly expectedOccurrenceKey: RequestTypeRouteOccurrenceKey;
      readonly actualOccurrenceKey: RequestTypeRouteOccurrenceKey;
    }>
  | Readonly<{
      readonly domain: 'resources';
      readonly source: Extract<RequestTypeSourceEvidenceIdentity, { readonly kind: 'resource' }>;
      readonly expectedOccurrenceKey: RequestTypeResourceOccurrenceKey;
      readonly actualOccurrenceKey: RequestTypeResourceOccurrenceKey;
    }>
  | Readonly<{
      readonly domain: 'requests';
      readonly source: Extract<RequestTypeSourceEvidenceIdentity, { readonly kind: 'request' }>;
      readonly expectedOccurrenceKey: RequestTypeRequestOccurrenceKey;
      readonly actualOccurrenceKey: RequestTypeRequestOccurrenceKey;
    }>;

export type RequestTypeDuplicateIdentityWitness =
  | Readonly<{
      readonly domain: 'routes';
      readonly semanticKey: RequestTypeRouteEvidenceKey;
      readonly occurrences: RequestTypeDuplicateOccurrencePair<RequestTypeRouteEvidenceReference>;
    }>
  | Readonly<{
      readonly domain: 'resources';
      readonly semanticKey: RequestTypeResourceEvidenceKey;
      readonly occurrences: RequestTypeDuplicateOccurrencePair<RequestTypeResourceEvidenceReference>;
    }>
  | Readonly<{
      readonly domain: 'requests';
      readonly semanticKey: RequestTypeRequestEvidenceKey;
      readonly occurrences: RequestTypeDuplicateOccurrencePair<RequestTypeRequestEvidenceReference>;
    }>;

/**
 * Domain-correlated counterexamples for duplicate-location laws.
 * A failure cannot mix a route with a request/resource occurrence or attach a
 * resource key to route evidence. Collision-key equality is checked by its own law.
 */
export type RequestTypeDuplicateOccurrenceLocationFailureEvidence =
  | Readonly<{
      readonly domain: 'routes';
      readonly semanticKey: RequestTypeRouteEvidenceKey;
      readonly occurrences: RequestTypeDuplicateOccurrencePair<RequestTypeRouteEvidenceReference>;
      readonly repeatedOccurrenceKey: RequestTypeRouteOccurrenceKey;
    }>
  | Readonly<{
      readonly domain: 'resources';
      readonly semanticKey: RequestTypeResourceEvidenceKey;
      readonly occurrences: RequestTypeDuplicateOccurrencePair<RequestTypeResourceEvidenceReference>;
      readonly repeatedOccurrenceKey: RequestTypeResourceOccurrenceKey;
    }>
  | Readonly<{
      readonly domain: 'requests';
      readonly semanticKey: RequestTypeRequestEvidenceKey;
      readonly occurrences: RequestTypeDuplicateOccurrencePair<RequestTypeRequestEvidenceReference>;
      readonly repeatedOccurrenceKey: RequestTypeRequestOccurrenceKey;
    }>;

/**
 * Every repeated pair retains one source domain and its matching semantic-key
 * namespace. This prevents a verifier from returning a heterogeneous pair list
 * that cannot be interpreted as one duplicate-identity counterexample.
 */
export type RequestTypePairwiseDuplicateOccurrenceLocationFailureEvidence =
  | Readonly<{
      readonly domain: 'routes';
      readonly semanticKey: RequestTypeRouteEvidenceKey;
      readonly repeatedPairs: RequestTypeNonEmptyLedger<Readonly<{
        readonly first: RequestTypeRouteEvidenceReference;
        readonly second: RequestTypeRouteEvidenceReference;
        readonly repeatedOccurrenceKey: RequestTypeRouteOccurrenceKey;
      }>>;
    }>
  | Readonly<{
      readonly domain: 'resources';
      readonly semanticKey: RequestTypeResourceEvidenceKey;
      readonly repeatedPairs: RequestTypeNonEmptyLedger<Readonly<{
        readonly first: RequestTypeResourceEvidenceReference;
        readonly second: RequestTypeResourceEvidenceReference;
        readonly repeatedOccurrenceKey: RequestTypeResourceOccurrenceKey;
      }>>;
    }>
  | Readonly<{
      readonly domain: 'requests';
      readonly semanticKey: RequestTypeRequestEvidenceKey;
      readonly repeatedPairs: RequestTypeNonEmptyLedger<Readonly<{
        readonly first: RequestTypeRequestEvidenceReference;
        readonly second: RequestTypeRequestEvidenceReference;
        readonly repeatedOccurrenceKey: RequestTypeRequestOccurrenceKey;
      }>>;
    }>;

/**
 * Invalid-input evidence is reserved for malformed contracts or unsupported
 * policy. Duplicate canonical identities are semantic conflicts under the
 * canonical resource/group identity policy and belong in the conflict ledger.
 */
export type RequestTypeDerivationInvalidInputEvidence =
  | Readonly<{
      readonly reason: 'invalid_contract';
      readonly expectedContractKind: 'request_type_derivation_contract';
      readonly actualContractKind: string;
      readonly failedLaw: 'authority_policy_matches_contract' | 'every_source_has_a_disposition';
    }>
  | Readonly<{
      readonly reason: 'unsupported_policy';
      readonly supportedPolicy: 'exact_then_normalized_unique';
      readonly actualPolicy: string;
      readonly failedLaw: 'authority_policy_matches_contract';
    }>;

export type RequestTypeDerivationInputRejection =
  | Readonly<{
      readonly reason: 'invalid_contract';
      readonly evidence: Extract<RequestTypeDerivationInvalidInputEvidence, { readonly reason: 'invalid_contract' }>;
    }>
  | Readonly<{
      readonly reason: 'unsupported_policy';
      readonly evidence: Extract<RequestTypeDerivationInvalidInputEvidence, { readonly reason: 'unsupported_policy' }>;
    }>;

export type RequestTypeDerivationJudgment =
  | Readonly<{
      readonly kind: 'derived';
      readonly groups: readonly RequestType[];
      readonly proof: RequestTypeDerivationProofFor<'closed'>;
    }>
  | Readonly<{
      readonly kind: 'incomplete';
      readonly groups: readonly RequestType[];
      readonly unresolved: RequestTypeNonEmptyLedger<RequestTypeUnresolvedRouteReceipt>;
      readonly proof: RequestTypeDerivationProofFor<'incomplete'>;
    }>
  | Readonly<{
      readonly kind: 'conflict';
      readonly groups: readonly RequestType[];
      readonly conflicts: RequestTypeNonEmptyLedger<RequestTypeDerivationConflict>;
      readonly proof: RequestTypeDerivationProofFor<'conflicted'>;
    }>
  | (Readonly<{ readonly kind: 'invalid_input' }> & RequestTypeDerivationInputRejection);


/**
 * A verifier failure is a typed counterexample, not only a diagnostic label.
 * Each failure carries a law identifier and the smallest semantic witness needed
 * to explain which contract law was violated and which source/group facts must be inspected.
 */
export type RequestTypeDerivationVerificationFailure =
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'route_has_explicit_request_binding';
      readonly reason: 'explicit_request_binding_not_preserved';
      readonly evidence: Readonly<{
        readonly route: RequestTypeRouteEvidenceReference;
        readonly binding: Extract<RouteSemanticFlow['binding']['request'], { readonly kind: 'form_request' }>;
        readonly actualDisposition: RequestTypeRouteDisposition['kind'];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'request_identity_exact_match';
      readonly reason: 'exact_request_identity_mismatch';
      readonly evidence: Readonly<{
        readonly route: RequestTypeRouteEvidenceReference;
        readonly requestedIdentity: string;
        readonly resolvedRequest: RequestTypeRequestEvidenceReference;
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'request_identity_normalized_unique_match';
      readonly reason: 'normalized_request_identity_not_unique_or_mismatched';
      readonly evidence: Readonly<{
        readonly route: RequestTypeRouteEvidenceReference;
        readonly requestedIdentity: string;
        readonly candidates: readonly RequestTypeRequestEvidenceReference[];
        readonly actualResolution: RequestTypeRequestResolution;
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'ambiguous_identity_is_conflict';
      readonly reason: 'ambiguous_identity_not_recorded_as_conflict';
      readonly evidence: Readonly<{
        readonly route: RequestTypeRouteEvidenceReference;
        readonly ambiguity: Extract<RequestTypeRequestResolution, { readonly kind: 'ambiguous_exact' | 'ambiguous_normalized' }>;
        readonly actualDisposition: RequestTypeRouteDisposition['kind'];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'resource_identity_is_canonical';
      readonly reason: 'resource_canonical_identity_mismatch';
      readonly evidence: Readonly<{
        readonly resource: RequestTypeResourceEvidenceReference;
        readonly expectedCanonicalIdentity: RequestTypeCanonicalResourceIdentity;
        readonly actualCanonicalIdentity: RequestTypeCanonicalResourceIdentity;
        readonly expectedCanonicalKey: RequestTypeGroupKey;
        readonly actualCanonicalKey: RequestTypeGroupKey;
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'route_contributes_action';
      readonly reason: 'route_action_contribution_mismatch';
      readonly evidence: Readonly<{
        readonly groupKey: RequestTypeGroupKey;
        readonly route: RequestTypeRouteEvidenceReference;
        readonly expectedActions: RequestType['actions'];
        readonly actualActions: RequestType['actions'];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'route_contributes_response';
      readonly reason: 'route_response_contribution_mismatch';
      readonly evidence: Readonly<{
        readonly groupKey: RequestTypeGroupKey;
        readonly route: RequestTypeRouteEvidenceReference;
        readonly expectedResponse: RequestType['response'];
        readonly actualResponse: RequestType['response'];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'invalid_input_requires_typed_counterexample';
      readonly reason: 'invalid_input_counterexample_missing_or_inconsistent';
      readonly evidence: Readonly<{
        readonly expectedRejection: RequestTypeDerivationInputRejection;
        readonly actualRejection: RequestTypeDerivationInputRejection | null;
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'judgment_payload_matches_proof_ledger';
      readonly reason: 'judgment_has_no_proof';
      readonly evidence: Readonly<{ readonly judgmentKind: Exclude<RequestTypeDerivationJudgment['kind'], 'invalid_input'> }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'every_source_has_a_disposition' | 'judgment_closure_matches_source_ledger';
      readonly reason: 'source_inventory_mismatch' | 'source_receipt_coverage_mismatch';
      readonly evidence: Readonly<{
        readonly domain: 'routes' | 'resources' | 'requests';
        readonly expectedKeys: readonly RequestTypeEvidenceKey[];
        readonly actualKeys: readonly RequestTypeEvidenceKey[];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'source_evidence_inventory_matches_input';
      readonly reason: 'source_inventory_mismatch';
      readonly evidence: Readonly<{
        readonly domain: 'routes' | 'resources' | 'requests';
        readonly expectedKeys: readonly RequestTypeEvidenceKey[];
        readonly actualKeys: readonly RequestTypeEvidenceKey[];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'evidence_key_matches_source_domain';
      readonly reason: 'source_key_domain_mismatch';
      readonly evidence: Readonly<{
        readonly sourceKind: RequestTypeSourceEvidenceIdentity['kind'];
        readonly semanticKey: RequestTypeEvidenceKey;
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'request_binding_kind_matches_route_disposition' | 'framework_request_binding_is_accounted_exclusion' | 'every_source_has_a_disposition';
      readonly reason: 'route_disposition_mismatch' | 'request_binding_disposition_mismatch';
      readonly evidence: Readonly<{
        readonly route: RequestTypeRouteEvidenceReference;
        readonly expected: RequestTypeRouteDisposition['kind'];
        readonly actual: RequestTypeRouteDisposition['kind'];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'group_contributions_are_reconciled' | 'every_group_contribution_has_receipt';
      readonly reason: 'group_membership_mismatch' | 'contribution_ledger_mismatch';
      readonly evidence: Readonly<{
        readonly groupKey: RequestTypeGroupKey;
        readonly expectedRoutes: readonly RequestTypeRouteEvidenceKey[];
        readonly actualRoutes: readonly RequestTypeRouteEvidenceKey[];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'group_receipt_matches_judgment_output' | 'judgment_payload_matches_proof_ledger';
      readonly reason: 'group_output_mismatch' | 'judgment_groups_mismatch_proof_outputs';
      readonly evidence: Readonly<{
        readonly expected: readonly RequestType[];
        readonly actual: readonly RequestType[];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'contributed_route_has_resolved_resource';
      readonly reason: 'contributed_route_unresolved_resource';
      readonly evidence: Readonly<{
        readonly route: RequestTypeRouteEvidenceReference;
        readonly resolution: RequestTypeResourceResolution;
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'contribution_transition_is_contiguous' | 'contribution_transition_matches_policy' | 'group_result_matches_final_transition';
      readonly reason: 'contribution_transition_mismatch' | 'contribution_policy_mismatch';
      readonly evidence: Readonly<{
        readonly groupKey: RequestTypeGroupKey;
        readonly route: RequestTypeRouteEvidenceReference;
        readonly transition: RequestTypeGroupContributionReceipt['transition'];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'group_key_matches_resource_identity';
      readonly reason: 'invalid_group_key';
      readonly evidence: Readonly<{
        readonly resource: RequestTypeResourceEvidenceReference;
        readonly actualGroupKey: string;
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'group_contributions_are_reconciled' | 'every_group_contribution_has_receipt';
      readonly reason: 'relation_ledger_mismatch';
      readonly evidence: Readonly<{
        readonly expected: readonly RequestTypeDerivationRelation[];
        readonly actual: readonly RequestTypeDerivationRelation[];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'authority_policy_matches_contract';
      readonly reason: 'policy_mismatch';
      readonly evidence: Readonly<{
        readonly expectedPolicy: RequestTypeDerivationPolicy;
        readonly actualPolicy: RequestTypeDerivationPolicy;
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'judgment_closure_matches_source_ledger' | 'judgment_kind_matches_closure';
      readonly reason: 'closure_mismatch' | 'judgment_kind_closure_mismatch';
      readonly evidence: Readonly<{
        readonly expected: RequestTypeDerivationClosure['kind'];
        readonly actual: RequestTypeDerivationClosure['kind'];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'incomplete_judgment_matches_unresolved_ledger';
      readonly reason: 'incomplete_ledger_mismatch';
      readonly evidence: Readonly<{
        readonly expected: readonly RequestTypeUnresolvedRouteReceipt[];
        readonly actual: readonly RequestTypeUnresolvedRouteReceipt[];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'conflict_judgment_matches_conflict_ledger';
      readonly reason: 'conflict_ledger_mismatch';
      readonly evidence: Readonly<{
        readonly expected: readonly RequestTypeDerivationConflict[];
        readonly actual: readonly RequestTypeDerivationConflict[];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'input_rejection_matches_source_evidence';
      readonly reason: 'input_rejection_evidence_mismatch';
      readonly evidence: Readonly<{
        readonly expected: RequestTypeDerivationInputRejection;
        readonly actual: RequestTypeDerivationInputRejection;
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'duplicate_occurrences_match_collision_key';
      readonly reason: 'duplicate_occurrence_key_mismatch';
      readonly evidence: Readonly<{
        readonly domain: RequestTypeDuplicateIdentityWitness['domain'];
        readonly semanticKey: RequestTypeEvidenceKey;
        readonly occurrences: readonly RequestTypeEvidenceReference[];
        readonly mismatchedOccurrences: readonly RequestTypeEvidenceReference[];
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'duplicate_occurrences_are_distinct_source_locations';
      readonly reason: 'duplicate_occurrence_location_reused';
      readonly evidence: RequestTypeDuplicateOccurrenceLocationFailureEvidence;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'all_duplicate_occurrence_locations_are_pairwise_distinct';
      readonly reason: 'duplicate_occurrence_pairwise_location_reused';
      readonly evidence: RequestTypePairwiseDuplicateOccurrenceLocationFailureEvidence;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'source_occurrence_location_matches_evidence';
      readonly reason: 'source_occurrence_location_mismatch';
      readonly evidence: Readonly<{
        readonly mismatches: RequestTypeNonEmptyLedger<Readonly<{
          readonly source: RequestTypeEvidenceReference;
          readonly expectedLocation: RequestTypeSourceOccurrenceLocation;
          readonly actualLocation: RequestTypeSourceOccurrenceLocation;
        }>>;
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'source_occurrence_key_matches_source_coordinates';
      readonly reason: 'source_occurrence_key_mismatch';
      readonly evidence: Readonly<{
        readonly mismatches: RequestTypeNonEmptyLedger<RequestTypeSourceOccurrenceKeyMismatch>;
      }>;
    }>
  | Readonly<{
      readonly kind: 'invalid';
      readonly law: 'source_occurrence_belongs_to_input';
      readonly reason: 'source_occurrence_not_found_in_input';
      readonly evidence: Readonly<{
        readonly source: RequestTypeEvidenceReference;
        readonly candidateLocations: readonly RequestTypeSourceOccurrenceLocation[];
      }>;
    }>;

export type RequestTypeDerivationVerification =
  | Readonly<{
      readonly kind: 'valid';
      readonly proofKind: 'request_type_derivation_proof';
      /** Successful verification is an exhaustive law-coverage claim. */
      readonly verifiedLaws: RequestTypeDerivationVerifiedLawCoverage;
    }>
  /** Confirms a typed rejection; this is not equivalent to a successful derivation. */
  | (Readonly<{ readonly kind: 'rejection_confirmed' }> & RequestTypeDerivationInputRejection)
  /**
   * Records a source-grounded partial check without pretending the complete law
   * set passed. Consumers must treat this as unverified, not as `valid`.
   */
  | Readonly<{
      readonly kind: 'verification_incomplete';
      readonly reason: 'identity_conflict_ledger_confirmed';
      readonly checkedEvidence: 'duplicate_identity_occurrence_correlation';
      readonly missingLaws: RequestTypeNonEmptyLedger<RequestTypeDerivationLawId>;
    }>
  | Readonly<{
      readonly kind: 'verification_incomplete';
      readonly reason: 'group_contribution_replay_confirmed';
      readonly checkedEvidence: 'group_fold_receipt_replay';
      /** Laws outside the replayed group-contribution slice remain explicitly unverified. */
      readonly missingLaws: RequestTypeNonEmptyLedger<RequestTypeDerivationLawId>;
    }>
  | RequestTypeDerivationVerificationFailure;

export interface RequestTypeDerivationContract {
  readonly kind: 'request_type_derivation_contract';
  readonly authority: 'upstream';
  readonly closed: true;
  readonly reasoning: 'declarative_source_relation_closure';
  readonly policy: RequestTypeDerivationPolicy;
  /** Every law is required by the contract; a partial law list is not a closed contract. */
  readonly laws: RequestTypeDerivationRequiredLawCoverage;
}

/**
 * Canonical upstream policy/law value for request-type semantic derivation.
 * All semantic capabilities must share this exact value; consumers must not
 * reconstruct a local policy or silently select a subset of the law contract.
 */
export const requestTypeDerivationContract: RequestTypeDerivationContract = Object.freeze({
  kind: 'request_type_derivation_contract',
  authority: 'upstream',
  closed: true,
  reasoning: 'declarative_source_relation_closure',
  policy: Object.freeze({
    requestResolution: Object.freeze({
      kind: 'exact_then_normalized_unique',
      exactMatchDominatesNormalizedMatch: true,
      exactAmbiguity: 'conflict',
      normalizedAmbiguity: 'conflict',
      missing: 'incomplete_judgment',
    }),
    resourceIdentity: Object.freeze({
      kind: 'canonical_case_insensitive_identity',
      duplicateIdentity: 'conflict',
      missingIdentity: 'incomplete_judgment',
    }),
    groupIdentity: Object.freeze({
      kind: 'canonical_resource_identity',
      collision: 'conflict',
    }),
    actionContribution: Object.freeze({
      kind: 'merge_by_action_name',
      absent: 'append',
      existingEmptyOrIncomingFieldful: 'replace_existing',
      otherwise: 'retain_existing',
    }),
    responseContribution: Object.freeze({
      kind: 'merge_response',
      existingAbsentOrEmpty: 'accept_incoming',
      existingNonempty: 'retain_existing',
    }),
    groupContribution: Object.freeze({
      initialGroup: 'before_absent_after_equals_initial_result',
      mergeGroup: 'before_present_after_equals_policy_merge',
      chain: 'each_before_equals_previous_after',
      finalOutput: 'equals_last_after',
    }),
    outcomeCoherence: Object.freeze({
      derived: 'closed_with_empty_conflict_ledger',
      incomplete: 'incomplete_with_nonempty_unresolved_ledger',
      conflict: 'conflicted_with_nonempty_conflict_ledger',
      judgmentGroups: 'equal_group_receipt_results',
      proofLedgers: 'judgment_ledgers_equal_proof_ledgers',
    }),
    closure: Object.freeze({
      everyRouteHasDisposition: true,
      everyResourceHasDisposition: true,
      everyRequestHasDisposition: true,
      unresolvedEvidence: 'incomplete_judgment',
      semanticConflict: 'conflict_judgment',
      explicitNoRequestBinding: 'accounted_exclusion',
      frameworkRequestBinding: 'accounted_exclusion',
    }),
  }),
  laws: Object.freeze({
    route_has_explicit_request_binding: 'required',
    request_identity_exact_match: 'required',
    request_identity_normalized_unique_match: 'required',
    ambiguous_identity_is_conflict: 'required',
    resource_identity_is_canonical: 'required',
    route_contributes_action: 'required',
    route_contributes_response: 'required',
    group_contributions_are_reconciled: 'required',
    every_source_has_a_disposition: 'required',
    evidence_key_matches_source_domain: 'required',
    source_evidence_inventory_matches_input: 'required',
    framework_request_binding_is_accounted_exclusion: 'required',
    request_binding_kind_matches_route_disposition: 'required',
    every_group_contribution_has_receipt: 'required',
    judgment_closure_matches_source_ledger: 'required',
    group_receipt_matches_judgment_output: 'required',
    contributed_route_has_resolved_resource: 'required',
    contribution_transition_is_contiguous: 'required',
    contribution_transition_matches_policy: 'required',
    group_result_matches_final_transition: 'required',
    group_key_matches_resource_identity: 'required',
    judgment_kind_matches_closure: 'required',
    judgment_payload_matches_proof_ledger: 'required',
    incomplete_judgment_matches_unresolved_ledger: 'required',
    conflict_judgment_matches_conflict_ledger: 'required',
    authority_policy_matches_contract: 'required',
    invalid_input_requires_typed_counterexample: 'required',
    input_rejection_matches_source_evidence: 'required',
    duplicate_occurrences_match_collision_key: 'required',
    duplicate_occurrences_are_distinct_source_locations: 'required',
    all_duplicate_occurrence_locations_are_pairwise_distinct: 'required',
    source_occurrence_key_matches_source_coordinates: 'required',
    source_occurrence_location_matches_evidence: 'required',
    source_occurrence_belongs_to_input: 'required',
  }),
});

/** @deprecated Transitional runtime-facing shape. Prefer RequestTypeDerivationSemanticAuthorityInterface for the interface-first semantic assessment contract. */
/**
 * The authority's public derivation boundary couples the judgment to its
 * verification result. A caller cannot receive a bare judgment and silently
 * skip verification through this interface.
 */
export type RequestTypeDerivationAuthorityOutcome =
  | Readonly<{
      readonly kind: 'verified';
      readonly judgment: Exclude<RequestTypeDerivationJudgment, { readonly kind: 'invalid_input' }>;
      readonly verification: Extract<RequestTypeDerivationVerification, { readonly kind: 'valid' }>;
    }>
  | Readonly<{
      readonly kind: 'input_rejected';
      readonly judgment: Extract<RequestTypeDerivationJudgment, { readonly kind: 'invalid_input' }>;
      readonly verification: Extract<RequestTypeDerivationVerification, { readonly kind: 'rejection_confirmed' }>;
    }>
  | Readonly<{
      readonly kind: 'verification_failed';
      readonly judgment: Exclude<RequestTypeDerivationJudgment, { readonly kind: 'invalid_input' }>;
      readonly verification: RequestTypeDerivationVerificationFailure;
    }>
  /** An input-rejection judgment whose rejection could not be confirmed by the verifier. */
  | Readonly<{
      readonly kind: 'rejection_verification_failed';
      readonly judgment: Extract<RequestTypeDerivationJudgment, { readonly kind: 'invalid_input' }>;
      readonly verification: RequestTypeDerivationVerificationFailure;
    }>
  /** Prevents contradictory judgment/verification discriminants from being exposed as trusted output. */
  | Readonly<{
      readonly kind: 'authority_inconsistent';
      readonly reason: 'judgment_verification_kind_mismatch' | 'rejection_reason_mismatch' | 'rejection_witness_mismatch' | 'contract_law_coverage_incomplete' | 'verified_law_coverage_incomplete';
      readonly judgment: RequestTypeDerivationJudgment;
      readonly verification: RequestTypeDerivationVerification;
    }>;

/** @deprecated Transitional contract retained until the authority executor is migrated in a later phase. */
export interface RequestTypeDerivationAuthorityInterface {
  readonly contract: RequestTypeDerivationContract;
  /** Derivation must verify before exposing a judgment as consumable output. */
  readonly derive: (input: RequestTypeDerivationInput) => RequestTypeDerivationAuthorityOutcome;
  /** Exposed for independent audits and tests; callers must not bypass derive's verified outcome. */
  readonly verify: (input: RequestTypeDerivationInput, judgment: RequestTypeDerivationJudgment) => RequestTypeDerivationVerification;
}

/**
 * Phase 1578 semantic authority model.
 *
 * Verification validity and derivation completeness are different semantic
 * dimensions. A verifier may confirm that an `incomplete` or `conflict`
 * judgment faithfully describes the evidence, but that must not be projected
 * as a successful/complete derivation. The outcome algebra preserves both
 * dimensions instead of collapsing every valid verification into `verified`.
 */
export const REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS = [
  'closed_derivation_with_complete_verification',
  'incomplete_derivation_with_complete_verification',
  'conflicted_derivation_with_complete_verification',
  'non_invalid_judgment_with_counterexample',
  'invalid_input_with_matching_rejection_witness',
  'invalid_input_with_rejection_counterexample',
  'judgment_verification_kind_conflict',
  'rejection_reason_conflict',
  'rejection_evidence_conflict',
  'contract_law_coverage_incomplete',
  'verified_law_coverage_incomplete',
] as const;

export type RequestTypeAuthorityDecisionRuleId =
  typeof REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS[number];

export type RequestTypeAuthorityDecisionRuleCoverage = Readonly<
  Record<RequestTypeAuthorityDecisionRuleId, 'required'>
>;

/**
 * Coverage describes contract completeness only. The judgment authority premises
 * own the verification witness separately, so the same witness is not embedded in
 * both coverage and decision proof. Inconsistency decisions carry typed counterevidence
 * for missing laws.
 */
export type RequestTypeAuthorityCoverageEvidence =
  | Readonly<{
      readonly kind: 'complete';
      readonly contract: RequestTypeDerivationContract;
    }>
  | Readonly<{
      readonly kind: 'contract_incomplete';
      /** The actual contract is retained so the rejection remains attributable and checkable. */
      readonly contract: RequestTypeDerivationContract;
      readonly missingLaws: RequestTypeNonEmptyLedger<RequestTypeDerivationLawId>;
    }>
  | Readonly<{
      readonly kind: 'verification_incomplete';
      readonly contract: RequestTypeDerivationContract;
      readonly missingLaws: RequestTypeNonEmptyLedger<RequestTypeDerivationLawId>;
    }>;

/** Coverage witness whose contract-bearing variants are tied to one capability contract. */
export type RequestTypeAuthorityCoverageEvidenceFor<
  TContract extends RequestTypeDerivationContract,
> =
  | Readonly<{ readonly kind: 'complete'; readonly contract: TContract }>
  | Readonly<{
      readonly kind: 'contract_incomplete';
      readonly contract: TContract;
      readonly missingLaws: RequestTypeNonEmptyLedger<RequestTypeDerivationLawId>;
    }>
  | Readonly<{
      readonly kind: 'verification_incomplete';
      readonly contract: TContract;
      readonly missingLaws: RequestTypeNonEmptyLedger<RequestTypeDerivationLawId>;
    }>;


/**
 * Explicit upstream operation for producing the coverage witness consumed by
 * semantic decision composition. Coverage is evidence about contract and proof
 * law completeness; it does not infer or repair the source judgment.
 */
export interface RequestTypeDerivationAuthorityCoverageInterface<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
> {
  readonly contract: TContract;
  readonly assess: (
    verification: RequestTypeDerivationVerification,
  ) => RequestTypeAuthorityCoverageEvidenceFor<TContract>;
}

/**
 * A decision proof carries its actual semantic premises. The conclusion is
 * correlated with the judgment and verification variants; `kind` labels alone
 * are deliberately insufficient to construct a successful proof.
 */
export type RequestTypeAuthorityDecisionProof =
  | Readonly<{
      readonly ruleId: 'closed_derivation_with_complete_verification';
      readonly premises: Readonly<{
      readonly input: RequestTypeDerivationInput;
        readonly judgment: Extract<RequestTypeDerivationJudgment, { readonly kind: 'derived' }>;
        readonly verification: Extract<RequestTypeDerivationVerification, { readonly kind: 'valid' }>;
        readonly coverage: Extract<RequestTypeAuthorityCoverageEvidence, { readonly kind: 'complete' }>;
      }>;
      readonly conclusion: 'derivation_verified';
    }>
  | Readonly<{
      readonly ruleId: 'incomplete_derivation_with_complete_verification';
      readonly premises: Readonly<{
      readonly input: RequestTypeDerivationInput;
        readonly judgment: Extract<RequestTypeDerivationJudgment, { readonly kind: 'incomplete' }>;
        readonly verification: Extract<RequestTypeDerivationVerification, { readonly kind: 'valid' }>;
        readonly coverage: Extract<RequestTypeAuthorityCoverageEvidence, { readonly kind: 'complete' }>;
      }>;
      readonly conclusion: 'incompleteness_verified';
    }>
  | Readonly<{
      readonly ruleId: 'conflicted_derivation_with_complete_verification';
      readonly premises: Readonly<{
      readonly input: RequestTypeDerivationInput;
        readonly judgment: Extract<RequestTypeDerivationJudgment, { readonly kind: 'conflict' }>;
        readonly verification: Extract<RequestTypeDerivationVerification, { readonly kind: 'valid' }>;
        readonly coverage: Extract<RequestTypeAuthorityCoverageEvidence, { readonly kind: 'complete' }>;
      }>;
      readonly conclusion: 'conflict_verified';
    }>
  | Readonly<{
      readonly ruleId: 'non_invalid_judgment_with_counterexample';
      readonly premises: Readonly<{
      readonly input: RequestTypeDerivationInput;
        readonly judgment: Exclude<RequestTypeDerivationJudgment, { readonly kind: 'invalid_input' }>;
        readonly verification: RequestTypeDerivationVerificationFailure;
        readonly coverage: RequestTypeAuthorityCoverageEvidence;
      }>;
      readonly conclusion: 'verification_failed';
    }>
  | Readonly<{
      readonly ruleId: 'invalid_input_with_matching_rejection_witness';
      readonly premises: Readonly<{
      readonly input: RequestTypeDerivationInput;
        readonly judgment: Extract<RequestTypeDerivationJudgment, { readonly kind: 'invalid_input' }>;
        readonly verification: Extract<RequestTypeDerivationVerification, { readonly kind: 'rejection_confirmed' }>;
        readonly coverage: RequestTypeAuthorityCoverageEvidence;
      }>;
      readonly conclusion: 'input_rejected';
    }>
  | Readonly<{
      readonly ruleId: 'invalid_input_with_rejection_counterexample';
      readonly premises: Readonly<{
      readonly input: RequestTypeDerivationInput;
        readonly judgment: Extract<RequestTypeDerivationJudgment, { readonly kind: 'invalid_input' }>;
        readonly verification: RequestTypeDerivationVerificationFailure;
        readonly coverage: RequestTypeAuthorityCoverageEvidence;
      }>;
      readonly conclusion: 'rejection_verification_failed';
    }>
  | Readonly<{
      readonly ruleId: 'judgment_verification_kind_conflict';
      readonly premises: Readonly<{
      readonly input: RequestTypeDerivationInput;
        readonly judgment: RequestTypeDerivationJudgment;
        readonly verification: RequestTypeDerivationVerification;
        readonly coverage: RequestTypeAuthorityCoverageEvidence;
        readonly mismatch: 'judgment_verification_kind_mismatch';
      }>;
      readonly conclusion: 'authority_inconsistent';
      readonly reason: 'judgment_verification_kind_mismatch';
    }>
  | Readonly<{
      readonly ruleId: 'rejection_reason_conflict';
      readonly premises: Readonly<{
      readonly input: RequestTypeDerivationInput;
        readonly judgment: Extract<RequestTypeDerivationJudgment, { readonly kind: 'invalid_input' }>;
        readonly verification: Extract<RequestTypeDerivationVerification, { readonly kind: 'rejection_confirmed' }>;
        readonly coverage: RequestTypeAuthorityCoverageEvidence;
        readonly expectedReason: RequestTypeDerivationInputRejection['reason'];
        readonly actualReason: RequestTypeDerivationInputRejection['reason'];
      }>;
      readonly conclusion: 'authority_inconsistent';
      readonly reason: 'rejection_reason_mismatch';
    }>
  | Readonly<{
      readonly ruleId: 'rejection_evidence_conflict';
      readonly premises: Readonly<{
      readonly input: RequestTypeDerivationInput;
        readonly judgment: Extract<RequestTypeDerivationJudgment, { readonly kind: 'invalid_input' }>;
        readonly verification: Extract<RequestTypeDerivationVerification, { readonly kind: 'rejection_confirmed' }>;
        readonly coverage: RequestTypeAuthorityCoverageEvidence;
        readonly evidenceRelation: 'not_equivalent';
      }>;
      readonly conclusion: 'authority_inconsistent';
      readonly reason: 'rejection_witness_mismatch';
    }>
  | Readonly<{
      readonly ruleId: 'contract_law_coverage_incomplete';
      readonly premises: Readonly<{
      readonly input: RequestTypeDerivationInput;
        readonly judgment: RequestTypeDerivationJudgment;
        readonly verification: RequestTypeDerivationVerification;
        readonly coverage: Extract<RequestTypeAuthorityCoverageEvidence, { readonly kind: 'contract_incomplete' }>;
      }>;
      readonly conclusion: 'authority_inconsistent';
      readonly reason: 'contract_law_coverage_incomplete';
    }>
  | Readonly<{
      readonly ruleId: 'verified_law_coverage_incomplete';
      readonly premises: Readonly<{
      readonly input: RequestTypeDerivationInput;
        readonly judgment: RequestTypeDerivationJudgment;
        readonly verification: RequestTypeDerivationVerification;
        readonly coverage: Extract<RequestTypeAuthorityCoverageEvidence, { readonly kind: 'verification_incomplete' }>;
      }>;
      readonly conclusion: 'authority_inconsistent';
      readonly reason: 'verified_law_coverage_incomplete';
    }>;

/**
 * Closed semantic authority assessment. The proof is the single source of its
 * judgment and verification evidence, avoiding duplicated fields that could
 * drift apart from the proof's own premises.
 */
export type RequestTypeDerivationSemanticAuthorityAssessment =
  | Readonly<{
      readonly kind: 'derivation_verified';
      readonly decision: Extract<RequestTypeAuthorityDecisionProof, { readonly conclusion: 'derivation_verified' }>;
    }>
  | Readonly<{
      readonly kind: 'incompleteness_verified';
      readonly decision: Extract<RequestTypeAuthorityDecisionProof, { readonly conclusion: 'incompleteness_verified' }>;
    }>
  | Readonly<{
      readonly kind: 'conflict_verified';
      readonly decision: Extract<RequestTypeAuthorityDecisionProof, { readonly conclusion: 'conflict_verified' }>;
    }>
  | Readonly<{
      readonly kind: 'input_rejected';
      readonly decision: Extract<RequestTypeAuthorityDecisionProof, { readonly conclusion: 'input_rejected' }>;
    }>
  | Readonly<{
      readonly kind: 'verification_failed';
      readonly decision: Extract<RequestTypeAuthorityDecisionProof, { readonly conclusion: 'verification_failed' }>;
    }>
  | Readonly<{
      readonly kind: 'rejection_verification_failed';
      readonly decision: Extract<RequestTypeAuthorityDecisionProof, { readonly conclusion: 'rejection_verification_failed' }>;
    }>
  | Readonly<{
      readonly kind: 'authority_inconsistent';
      readonly decision: Extract<RequestTypeAuthorityDecisionProof, { readonly conclusion: 'authority_inconsistent' }>;
    }>;

/**
 * Contract-bound authority assessment. Unlike the legacy non-generic assessment,
 * every decision proof retains the contract family through the consumer boundary.
 * This prevents the pipeline type from erasing the proof/coverage binding after
 * authority has evaluated a candidate.
 */
export type RequestTypeDerivationSemanticAuthorityAssessmentFor<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> =
  | Readonly<{
      readonly kind: 'derivation_verified';
      readonly decision: Extract<RequestTypeDerivationSemanticAuthorityProofFor<TContract, TInference>, { readonly conclusion: 'derivation_verified' }>;
    }>
  | Readonly<{
      readonly kind: 'incompleteness_verified';
      readonly decision: Extract<RequestTypeDerivationSemanticAuthorityProofFor<TContract, TInference>, { readonly conclusion: 'incompleteness_verified' }>;
    }>
  | Readonly<{
      readonly kind: 'conflict_verified';
      readonly decision: Extract<RequestTypeDerivationSemanticAuthorityProofFor<TContract, TInference>, { readonly conclusion: 'conflict_verified' }>;
    }>
  | Readonly<{
      readonly kind: 'input_rejected';
      readonly decision: Extract<RequestTypeDerivationSemanticAuthorityProofFor<TContract, TInference>, { readonly conclusion: 'input_rejected' }>;
    }>
  | Readonly<{
      readonly kind: 'verification_failed';
      readonly decision: Extract<RequestTypeDerivationSemanticAuthorityProofFor<TContract, TInference>, { readonly conclusion: 'verification_failed' }>;
    }>
  | Readonly<{
      readonly kind: 'rejection_verification_failed';
      readonly decision: Extract<RequestTypeDerivationSemanticAuthorityProofFor<TContract, TInference>, { readonly conclusion: 'rejection_verification_failed' }>;
    }>
  | Readonly<{
      readonly kind: 'authority_inconsistent';
      readonly decision: Extract<RequestTypeDerivationSemanticAuthorityProofFor<TContract, TInference>, { readonly conclusion: 'authority_inconsistent' }>;
    }>;

/**
 * Closed candidate produced by semantic reasoning before authority adjudication.
 * The rule identifier and conclusion are part of the same discriminated proof as
 * the source input, judgment, verification, and coverage. Wiring passes this value
 * intact; it must not reconstruct a rule, classify a judgment, or pair witnesses.
 * Runtime authority may validate proof integrity, but must not re-run derivation.
 */
export type RequestTypeDerivationSemanticAuthorityCandidate = RequestTypeAuthorityDecisionProof;

/**
 * Rebind each decision-proof variant to the input and judgment carried by the
 * exact inference packet. The distributive conditional preserves each proof
 * variant's conclusion/judgment/verification correlation while preventing a
 * specialized inference packet from being paired with a different input or
 * judgment type at the authority boundary.
 */
type RequestTypeDerivationDecisionProofBoundToInference<
  TProof,
  TInference extends RequestTypeDerivationSemanticInferenceFor,
> = TProof extends Readonly<{
  readonly premises: infer TPremises;
}>
  ? TPremises extends Readonly<{
      readonly input: RequestTypeDerivationInput;
      readonly judgment: RequestTypeDerivationJudgment;
    }>
    ? Omit<TProof, 'premises'> & Readonly<{
        readonly premises: Omit<TPremises, 'input' | 'judgment'> & Readonly<{
          readonly input: TInference['input'];
          readonly judgment: TInference['judgment'];
        }>;
      }>
    : never
  : never;

/**
 * Contract-bound candidate envelope. The proof's own premises are correlated
 * with the inference packet, rather than merely carrying a detached identity
 * witness beside an independently typed input and judgment. The envelope also
 * binds coverage to the exact contract family. Runtime value equality is still
 * required because TypeScript cannot prove object identity.
 */
export type RequestTypeDerivationSemanticAuthorityProofFor<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> = RequestTypeDerivationDecisionProofBoundToInference<
  RequestTypeAuthorityDecisionProof,
  TInference
> & Readonly<{
  readonly premises: Readonly<{
    readonly coverage: RequestTypeAuthorityCoverageEvidenceFor<TContract>;
  }>;
  /**
   * Correlation-only witness linking the canonical decision-premise verification
   * result to the exact contract and inference packet that were checked. The
   * verification result itself remains canonical at `premises.verification`; it
   * is deliberately not copied into this binding envelope.
   */
  readonly verificationBinding: RequestTypeDerivationSemanticVerificationBindingFor<TContract, TInference>;
}>;

export interface RequestTypeDerivationSemanticAuthorityCandidateFor<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  /** Exact contract value under which the proof was formed. */
  readonly contract: TContract;
  /**
   * Proof premises retain the same contract family as the candidate envelope.
   * The envelope alone is insufficient: without this binding, a candidate could
   * carry contract A beside proof coverage for contract B.
   */
  readonly proof: RequestTypeDerivationSemanticAuthorityProofFor<TContract, TInference>;
}

/**
 * Interface-first authority boundary. The semantic candidate is already classified
 * by the upstream reasoning algebra. `evaluate` validates/adjudicates that closed
 * candidate and returns the same proof as the sole decision evidence; consumers do
 * not receive independent judgment/verification fields to reconcile themselves.
 */
export interface RequestTypeDerivationSemanticAuthorityInterface<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  readonly contract: TContract;
  readonly decisionRules: RequestTypeAuthorityDecisionRuleCoverage;
  /**
   * Authority evaluation is explicitly source-bound. The caller supplies the
   * invocation input separately from the candidate so an authority implementation
   * can reject a candidate whose embedded evidence is not the input being assessed.
   * This is a contract requirement, not permission for authority to re-derive meaning.
   */
  readonly evaluate: (
    input: TInference['input'],
    candidate: RequestTypeDerivationSemanticAuthorityCandidateFor<TContract, TInference>,
  ) => RequestTypeDerivationSemanticAuthorityAssessmentFor<TContract, TInference>;
}


/**
 * Contract-bound inference packet. The input and judgment travel together with
 * the exact policy contract that governed inference, so a verifier or decision
 * algebra cannot accidentally pair a judgment with a different invocation or
 * merely rely on a generic type parameter that disappears at the value boundary.
 */
export interface RequestTypeDerivationSemanticInferenceFor<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInput extends RequestTypeDerivationInput = RequestTypeDerivationInput,
  TJudgment extends RequestTypeDerivationJudgment = RequestTypeDerivationJudgment,
> {
  readonly contract: TContract;
  /** The exact raw source input preserved by this inference packet. */
  readonly input: TInput;
  /**
   * The canonical preparation packet for this exact input. Reasoning consumes
   * this prepared value, while downstream proof/authority retains the raw input
   * separately for identity checks. This makes the existing preparation operation
   * part of the upstream contract rather than an optional side path.
   */
  readonly preparedInput: RequestTypeDerivationSemanticInputPreparation<TInput>;
  /**
   * The exact closed judgment variant preserved by this inference packet.
   * Specializations may narrow the variant, but cannot widen beyond the domain
   * judgment algebra; proof/decision contracts then retain this same judgment.
   */
  readonly judgment: TJudgment;
}

/**
 * Semantic inference boundary owned by the semantic layer.
 *
 * `infer` receives the canonical preparation packet, not raw source arrays.
 * This forces source inventory and request/resource resolution to pass through
 * the existing upstream operation before semantic judgment production.
 *
 * `infer` is the only contract allowed to turn source evidence into a domain
 * judgment. Implementations may use indexes, relations, constraint solving,
 * fixed-point evaluation, or control flow internally; those mechanisms are not
 * semantic authorities in their own right. The result must be a closed judgment
 * whose proof accounts for source disposition, unresolved evidence, conflicts,
 * and group-contribution receipts.
 *
 * Scanner/wiring code must not implement this interface by locally classifying
 * routes, resolving Request identities, or merging group contributions.
 */
export interface RequestTypeDerivationSemanticReasoningInterface<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  /**
   * The policy/law contract under which this reasoning capability interprets
   * source evidence. A pipeline must bind this to its own contract type; a
   * scanner cannot silently pair a solver with a different semantic policy.
   */
  readonly contract: TContract;
  /**
   * The only operation allowed to infer semantic meaning from source evidence.
   * The returned judgment must preserve its evidence and closure proof; it may
   * not be repaired or reclassified by verification, authority, or consumers.
   */
  readonly infer: (
    input: TInference['preparedInput'],
  ) => TInference;
}

/**
 * Verification is a separate proof-checking capability. It checks a judgment
 * against its source evidence and the complete law contract; it does not derive
 * a replacement judgment or repair semantic omissions.
 */
/**
 * Verification envelope tied to the exact inference type it checked.
 * Carrying the inference alongside the result prevents decision composition
 * from accepting a free-standing verification value detached from its source
 * judgment. The generic inference parameter preserves the caller's specific
 * packet type through the verifier boundary.
 */
export interface RequestTypeDerivationSemanticVerificationFor<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  readonly contract: TContract;
  readonly inference: TInference;
  readonly result: RequestTypeDerivationVerification;
}

/**
 * Correlation-only witness for authority proofs. The proof's discriminated
 * `premises.verification` remains the sole verification-result value; this type
 * carries only the contract and inference identity context needed to bind it.
 */
export interface RequestTypeDerivationSemanticVerificationBindingFor<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  readonly contract: TContract;
  readonly inference: TInference;
}

/** Independent verifier port for binding each contribution to its canonical resource group. */
export interface RequestTypeDerivationGroupIdentityVerificationInterface {
  readonly matchesInput: (
    groups: readonly RequestTypeGroupReceipt[],
    preparedInput: RequestTypeDerivationSemanticInputPreparation,
  ) => boolean;
}

/** Independent verifier port for correlating canonical inventory references with the raw AST input. */
export interface RequestTypeDerivationInventoryAstVerificationInterface {
  readonly matchesInput: (preparedInput: RequestTypeDerivationSemanticInputPreparation) => boolean;
}

/** Independent verifier port for closing source ledgers on conflicted judgments. */
export interface RequestTypeDerivationConflictLedgerClosureVerificationInterface {
  readonly matchesInput: (inference: RequestTypeDerivationSemanticInferenceFor) => boolean;
}

/** Independent verifier port for closing group receipts on conflicted judgments. */
export interface RequestTypeDerivationConflictGroupVerificationInterface {
  readonly matchesInput: (inference: RequestTypeDerivationSemanticInferenceFor) => boolean;
}

/** Independent verifier port for correlating incoming action/response payloads with source AST. */
export interface RequestTypeDerivationIncomingContributionAstVerificationInterface {
  readonly matchesAst: (
    groups: readonly RequestTypeGroupReceipt[],
    preparedInput: RequestTypeDerivationSemanticInputPreparation,
  ) => boolean;
}

export interface RequestTypeDerivationProofVerificationInterface<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  readonly contract: TContract;
  /**
   * Verification is generic over the concrete inference packet. Implementations
   * must return that same packet in the envelope, not a newly inferred or
   * substituted judgment.
   */
  readonly verify: (
    inference: TInference,
  ) => RequestTypeDerivationSemanticVerificationFor<TContract, TInference>;
}

/**
 * Runtime integrity failures are explicit data, not permission to re-run semantic
 * reasoning. They describe broken correlation between already-produced witnesses.
 */
export type RequestTypeDerivationSemanticAuthorityIntegrityViolation =
  | 'authority_contract_mismatch'
  | 'verification_contract_mismatch'
  | 'inference_packet_mismatch'
  | 'source_input_mismatch'
  | 'judgment_mismatch'
  | 'verification_result_mismatch';

/** Closed result of checking correlation between existing semantic witnesses. */
export type RequestTypeDerivationSemanticAuthorityIntegrityResult<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> =
  | Readonly<{
      readonly kind: 'integrity_valid';
      readonly candidate: RequestTypeDerivationSemanticAuthorityCandidateFor<TContract, TInference>;
    }>
  | Readonly<{
      readonly kind: 'integrity_invalid';
      readonly violations: readonly [
        RequestTypeDerivationSemanticAuthorityIntegrityViolation,
        ...RequestTypeDerivationSemanticAuthorityIntegrityViolation[],
      ];
    }>;

/**
 * Explicit value-equivalence policy for contract witnesses crossing a runtime
 * boundary. Implementations must define stable semantic equality for the closed
 * contract value; reference equality is appropriate only when contracts are
 * intentionally identity-scoped. The relation must be deterministic, reflexive,
 * symmetric, and transitive. This capability compares policy values only; it does
 * not interpret source evidence or derive semantic judgments.
 */
export interface RequestTypeDerivationContractEquivalenceInterface<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
> {
  readonly equivalent: (left: TContract, right: TContract) => boolean;
}

/**
 * Interface contract for runtime witness correlation. This capability validates
 * values already produced by reasoning and verification; it must never infer,
 * classify, repair, or replace a judgment. The invocation input is supplied
 * independently so the validator can reject a stale or replayed candidate whose
 * proof premises do not belong to this invocation. Input, inference, judgment,
 * and verification-result object witnesses must preserve exact identity across
 * the proof boundary. Contract compatibility is evaluated only through the
 * explicit contract-equivalence capability, not an implicit or ad-hoc comparison.
 * A mismatch returns violations rather than a partially trusted candidate.
 */
export interface RequestTypeDerivationSemanticAuthorityIntegrityInterface<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  readonly contract: TContract;
  /** One canonical equivalence policy for all contract witnesses in this check. */
  readonly contractEquivalence: RequestTypeDerivationContractEquivalenceInterface<TContract>;
  readonly validate: (
    expectedInput: TInference['input'],
    candidate: RequestTypeDerivationSemanticAuthorityCandidateFor<TContract, TInference>,
    verification: RequestTypeDerivationSemanticVerificationFor<TContract, TInference>,
  ) => RequestTypeDerivationSemanticAuthorityIntegrityResult<TContract, TInference>;
}

/** Closed failure vocabulary for validating a returned authority assessment. */
export type RequestTypeDerivationAssessmentIntegrityFailure =
  | 'assessment_conclusion_mismatch'
  | 'decision_rule_mismatch'
  | 'judgment_kind_mismatch'
  | 'verification_kind_mismatch'
  | 'coverage_not_complete'
  | 'coverage_contract_mismatch'
  | 'authority_reason_mismatch';

/** Result of validating the closed proof envelope without deriving new meaning. */
export type RequestTypeDerivationSemanticAssessmentIntegrityResult =
  | Readonly<{ readonly kind: 'assessment_integrity_valid' }>
  | Readonly<{
      readonly kind: 'assessment_integrity_invalid';
      readonly reason: RequestTypeDerivationAssessmentIntegrityFailure;
    }>;

/**
 * Canonical source-bound service contract for scanner wiring.
 *
 * This is deliberately the only public operation needed by wiring: it accepts
 * source evidence and returns one closed authority assessment. The implementation
 * belongs to the semantic layer and composes inference, proof verification, and
 * authority adjudication. Wiring must not assemble an authority candidate from
 * separate input/judgment/verification values and must not re-classify the result.
 *
 * The returned assessment contains the decision proof as its sole source of
 * judgment/verification/coverage evidence. A consumer projects only the judgment
 * already carried by that proof; it must not infer the decision again.
 */
/** Closed result of pipeline derivation: integrity rejection cannot masquerade as an authority assessment. */
export type RequestTypeDerivationSemanticPipelineDerivationResult<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> =
  | RequestTypeDerivationSemanticAuthorityAssessmentFor<TContract, TInference>
  | Readonly<{
      readonly kind: 'integrity_rejected';
      readonly integrity: Extract<
        RequestTypeDerivationSemanticAuthorityIntegrityResult<TContract, TInference>,
        { readonly kind: 'integrity_invalid' }
      >;
    }>;

export interface RequestTypeDerivationSemanticPipelineInterface<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  /** The closed semantic policy governing this invocation. */
  readonly contract: TContract;
  /**
   * Canonical source-bound operation. This is the only capability exposed to
   * scanner/runtime consumers: inference, proof construction, verification,
   * and authority adjudication remain behind the semantic boundary.
   */
  readonly derive: (
    input: TInference['input'],
  ) => RequestTypeDerivationSemanticPipelineDerivationResult<TContract, TInference>;
  /**
   * Validate coherence of a closed assessment produced by this authority.
   * Checks proof-rule/judgment/verification/coverage correlation only; it must
   * not infer, repair, or reclassify source semantics. Runtime executors delegate
   * this semantic integrity check instead of maintaining a duplicate rule switch.
   */
  readonly validateAssessment: (
    assessment: RequestTypeDerivationSemanticAuthorityAssessmentFor<TContract, TInference>,
  ) => RequestTypeDerivationSemanticAssessmentIntegrityResult;
}

/**
 * Closed resolution of the RequestType semantic pipeline at an application boundary.
 * Missing production composition is represented as data before source acquisition;
 * it must never be confused with a semantic judgment or trigger a legacy fallback.
 */
export type RequestTypeDerivationSemanticPipelineResolutionInput =
  | Readonly<{
      readonly kind: 'request_type_semantic_pipeline_supplied';
      readonly pipeline: RequestTypeDerivationSemanticPipelineInterface;
    }>
  | Readonly<{
      readonly kind: 'cli_upstream_composition_missing';
    }>;

export type RequestTypeDerivationSemanticPipelineResolution =
  | Readonly<{
      readonly kind: 'request_type_semantic_pipeline_available';
      readonly pipeline: RequestTypeDerivationSemanticPipelineInterface;
    }>
  | Readonly<{
      readonly kind: 'request_type_semantic_pipeline_unavailable';
      readonly reason: 'cli_upstream_composition_missing';
      readonly requiredComposition: readonly [
        'manifest_composition',
        'request_type_semantic_pipeline',
      ];
    }>
  | Readonly<{
      readonly kind: 'request_type_semantic_pipeline_unavailable';
      readonly reason: 'semantic_contract_identity_mismatch';
      readonly expectedContract: RequestTypeDerivationContract;
      readonly suppliedContract: RequestTypeDerivationContract;
    }>;

export interface RequestTypeDerivationSemanticPipelineResolutionInterface {
  readonly kind: 'request_type_semantic_pipeline_resolution';
  readonly contractVersion: 2;
  readonly resolve: (
    input: RequestTypeDerivationSemanticPipelineResolutionInput,
  ) => RequestTypeDerivationSemanticPipelineResolution;
}

/**
 * One immutable premise packet for semantic decision construction. Keeping these
 * witnesses together prevents callers from accidentally swapping positional
 * judgment/verification/coverage arguments while composing the semantic algebra.
 */
export interface RequestTypeDerivationSemanticDecisionPremises<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  /**
   * The intended contract is present even when the coverage witness says that
   * the contract itself is incomplete. This prevents an incomplete-coverage
   * branch (whose witness retains the actual contract) from losing the
   * identity of the contract against which the decision is being made.
   */
  readonly contract: TContract;
  /** Input and judgment are one inference result, preventing cross-invocation pairing. */
  readonly inference: TInference;
  /** Must be the verification envelope produced for this exact inference packet. */
  readonly verification: RequestTypeDerivationSemanticVerificationFor<TContract, TInference>;
  readonly coverage: RequestTypeAuthorityCoverageEvidenceFor<TContract>;
}

/**
 * Closed decision-proof construction belongs to the semantic authority algebra,
 * not scanner wiring or the runtime executor. This capability correlates the
 * source input, inferred judgment, verifier result, and contract-coverage witness
 * into one member of `RequestTypeAuthorityDecisionProof`.
 *
 * The discriminated return type requires the produced proof to encode a coherent
 * pairing: a derived judgment cannot conclude incompleteness, and a successful
 * conclusion requires complete contract and verification coverage. Implementations
 * must preserve the supplied premises rather than re-run inference or repair a judgment.
 * The inference packet's contract must equal this capability's contract value.
 */
export interface RequestTypeDerivationSemanticDecisionInterface<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  /** The exact semantic contract used to interpret all supplied premises. */
  readonly contract: TContract;
  /**
   * Correlates one already-produced premise packet into a closed authority
   * candidate. It adjudicates logical coherence; it does not derive source
   * meaning, verify proof laws, or project downstream values.
   */
  readonly decide: (
    premises: RequestTypeDerivationSemanticDecisionPremises<TContract, TInference>,
  ) => RequestTypeDerivationSemanticAuthorityCandidateFor<TContract, TInference>;
}

/**
 * Semantic-layer composition surface. Unlike the consumer-facing pipeline,
 * this interface exposes the capabilities needed to construct the pipeline.
 * It must remain inside the semantic implementation boundary; scanner wiring
 * and runtime executors must depend on RequestTypeDerivationSemanticPipelineInterface
 * and must not invoke reasoning/verifier/authority independently.
 *
 * This is a composition contract, not a public pipeline implementation: it does
 * not inherit `derive`, because `derive` is the assembled operation owned by the
 * semantic implementation. Keeping the shapes disjoint prevents a composition
 * bundle from being mistaken for an already-assembled consumer service.
 *
 * All capabilities share the same contract and inference packet types. Implementations
 * must additionally bind them to the same contract value at construction time and
 * preserve each inference packet and verification witness at runtime; TypeScript
 * structural typing alone cannot establish object identity or value equality. The
 * factory/assembler must reject mismatched contract values before exposing a pipeline.
 */
export interface RequestTypeDerivationSemanticPipelineCompositionInterface<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  /** One canonical contract value shared by every semantic capability. */
  readonly contract: TContract;
  /** Existing canonical source preparation; mandatory before semantic reasoning. */
  readonly preparation: RequestTypeDerivationSemanticInputPreparationInterface<TInference['input']>;
  readonly reasoning: RequestTypeDerivationSemanticReasoningInterface<TContract, TInference>;
  /** Proof checking only; it cannot replace or repair the inferred judgment. */
  readonly verifier: RequestTypeDerivationProofVerificationInterface<TContract, TInference>;
  /** Correlates judgment, verification, and coverage into a closed decision proof. */
  readonly decision: RequestTypeDerivationSemanticDecisionInterface<TContract, TInference>;
  /** Adjudicates the closed candidate against the same source input and contract. */
  readonly authority: RequestTypeDerivationSemanticAuthorityInterface<TContract, TInference>;
  /** Validates witness correlation before authority is allowed to evaluate the candidate. */
  readonly integrity: RequestTypeDerivationSemanticAuthorityIntegrityInterface<TContract, TInference>;
}

/** Capabilities whose contract values do not agree cannot be assembled into a pipeline. */
export type RequestTypeDerivationSemanticPipelineContractMismatch = Readonly<{
  readonly kind: 'contract_mismatch';
  readonly capability: 'reasoning' | 'verifier' | 'decision' | 'authority' | 'integrity';
  readonly expected: RequestTypeDerivationContract;
  readonly actual: RequestTypeDerivationContract;
}>;

/** Result of validating the composition boundary before exposing a consumer pipeline. */
export type RequestTypeDerivationSemanticPipelineAssemblyResult<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> =
  | Readonly<{
      readonly kind: 'assembled';
      readonly pipeline: RequestTypeDerivationSemanticPipelineInterface<TContract, TInference>;
    }>
  | Readonly<{
      readonly kind: 'rejected';
      readonly mismatches: readonly [
        RequestTypeDerivationSemanticPipelineContractMismatch,
        ...RequestTypeDerivationSemanticPipelineContractMismatch[],
      ];
    }>;

/**
 * Interface-only assembly boundary. Its implementation must compare the actual
 * contract values of every capability with the composition contract before it
 * can expose a pipeline. Type parameters prevent accidental policy-family mixing;
 * this result makes runtime value mismatch an explicit, non-throwing outcome.
 */
export interface RequestTypeDerivationSemanticPipelineAssemblerInterface<
  TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract> =
    RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  readonly assemble: (
    composition: RequestTypeDerivationSemanticPipelineCompositionInterface<TContract, TInference>,
  ) => RequestTypeDerivationSemanticPipelineAssemblyResult<TContract, TInference>;
}

/** Only a fully derived judgment is eligible for downstream projection. */
export type RequestTypeDerivationProjectableJudgment = Extract<
  RequestTypeDerivationJudgment,
  { readonly kind: 'derived' }
>;

/**
 * A consumer-facing projection is judgment-only and can receive only the
 * positively verified `derived` variant. Incomplete, conflicting, and rejected
 * judgments are represented by authority outcomes and are not projectable.
 */
export interface RequestTypeDerivationJudgmentConsumerInterface {
  readonly project: (judgment: RequestTypeDerivationProjectableJudgment) => readonly RequestType[];
}

/**
 * Closed result of upstream operation preparation and runtime execution.
 * Only outcomes justified by semantic authority are represented here; contract
 * construction, source binding, and assessment validation belong upstream.
 */
export type RequestTypeDerivationRuntimeExecutionResult =
  | Readonly<{
      readonly kind: 'projected';
      readonly assessment: Extract<RequestTypeDerivationSemanticAuthorityAssessmentFor, { readonly kind: 'derivation_verified' }>;
      readonly projection: readonly RequestType[];
    }>
  | Readonly<{
      readonly kind: 'incomplete';
      readonly assessment: Extract<RequestTypeDerivationSemanticAuthorityAssessmentFor, { readonly kind: 'incompleteness_verified' }>;
    }>
  | Readonly<{
      readonly kind: 'conflict';
      readonly assessment: Extract<RequestTypeDerivationSemanticAuthorityAssessmentFor, { readonly kind: 'conflict_verified' }>;
    }>
  | Readonly<{
      readonly kind: 'input_rejected';
      readonly assessment: Extract<RequestTypeDerivationSemanticAuthorityAssessmentFor, { readonly kind: 'input_rejected' }>;
    }>
  | Readonly<{
      readonly kind: 'verification_failed';
      readonly assessment: Extract<RequestTypeDerivationSemanticAuthorityAssessmentFor, { readonly kind: 'verification_failed' }>;
    }>
  | Readonly<{
      readonly kind: 'rejection_verification_failed';
      readonly assessment: Extract<RequestTypeDerivationSemanticAuthorityAssessmentFor, { readonly kind: 'rejection_verification_failed' }>;
    }>
  | Readonly<{
      readonly kind: 'authority_inconsistent';
      readonly assessment: Extract<RequestTypeDerivationSemanticAuthorityAssessmentFor, { readonly kind: 'authority_inconsistent' }>;
    }>
  | Readonly<{
      readonly kind: 'assessment_integrity_failed';
      readonly reason: RequestTypeDerivationAssessmentIntegrityFailure;
      readonly assessment: RequestTypeDerivationSemanticAuthorityAssessmentFor;
    }>
  | Readonly<{
      readonly kind: 'authority_integrity_failed';
      readonly integrity: Extract<
        RequestTypeDerivationSemanticAuthorityIntegrityResult,
        { readonly kind: 'integrity_invalid' }
      >;
    }>;

/**
 * Upstream preparation contract for RequestType derivation.
 * Source evidence enters here; the returned value is the closed semantic
 * outcome. RequestType derivation is a pure compiler operation, so it must not
 * be wrapped in a runtime executor whose only job is to return this outcome.
 */
export interface RequestTypeDerivationOperationPreparationInterface {
  readonly prepare: (input: RequestTypeDerivationSemanticInputPreparation) => RequestTypeDerivationRuntimeExecutionResult;
}


/**
 * Result of the integrity gate. Invalid witnesses are terminal at this boundary:
 * the authority is not invoked and no replacement judgment or synthetic authority
 * assessment is manufactured.
 */
export type RequestTypeDerivationAuthorityIntegrityGateResult<
  TContract extends RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
> =
  | Readonly<{
      readonly kind: 'integrity_rejected';
      readonly integrity: Extract<
        RequestTypeDerivationSemanticAuthorityIntegrityResult<TContract, TInference>,
        { readonly kind: 'integrity_invalid' }
      >;
    }>
  | Readonly<{
      readonly kind: 'authority_evaluated';
      readonly assessment: RequestTypeDerivationSemanticAuthorityAssessmentFor<TContract, TInference>;
    }>;

/**
 * Invocation boundary for authority evaluation. The caller must pass the original
 * verification envelope produced for this inference packet. Passing the envelope
 * separately is deliberate: rebuilding it from candidate fields would make the
 * correlation checks tautological and would fail to detect detached/replayed
 * verifier output.
 */
export interface RequestTypeDerivationAuthorityIntegrityGateInterface<
  TContract extends RequestTypeDerivationContract,
  TInference extends RequestTypeDerivationSemanticInferenceFor<TContract>,
> {
  readonly evaluate: (
    input: RequestTypeDerivationInput,
    candidate: RequestTypeDerivationSemanticAuthorityCandidateFor<TContract, TInference>,
    verification: RequestTypeDerivationSemanticVerificationFor<TContract, TInference>,
  ) => RequestTypeDerivationAuthorityIntegrityGateResult<TContract, TInference>;
}

