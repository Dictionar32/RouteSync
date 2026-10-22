import type { LaravelControllerScanJudgment } from './laravelControllerScannerInterface';
import type { ResourceAst, ModelAst } from './ast';
import type { ResourceDefinition } from './resource';
import type { ModelDefinition } from './model';
import type { ResourceModelBindingBatchClosure, ResourceModelBindingJudgment, ResourceModelBindingOutcome, ResourceModelBindingJudgmentAuthority, ResourceRelationBindingEvidence } from './laravelScannerSemanticJudgment';
import type { ResourceReference } from './semanticReferences';
import type { SourceSpan } from './provenance';
import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { Sequence } from './collections';
import { RESOURCE_MODEL_BINDING_INVOCATION_INTEGRATION_MODEL, RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL, type ResourceModelBindingInvocationIntegrationModelInterface } from './resourceModelBindingSemanticInterface';

/** Closed upstream contract for resource binding from source-model knowledge. */
/** Source evidence is acquired once upstream and consumed as one inventory. Syntax stays generic so this upstream contract does not depend on lexer-owned AST types. */
export interface LaravelResourceSourceEvidence<Identity extends object, Syntax extends object> {
  readonly kind: 'resource_scan_evidence';
  readonly identity: Identity;
  readonly syntax: Syntax;
  readonly relations: readonly ResourceRelationBindingEvidence[];
}

export interface ResourceSourceEvidenceScannerInterface<
  Evidence extends LaravelResourceSourceEvidence<object, object> = LaravelResourceSourceEvidence<object, object>,
> {
  readonly kind: 'laravel_resource_source_evidence_scanner';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly scan: (sourceProject: SourceProjectIdentity) => Promise<readonly Evidence[]>;
}

export interface LaravelResourceScannerInterface<
  Evidence extends LaravelResourceSourceEvidence<object, object> = LaravelResourceSourceEvidence<object, object>,
> {
  readonly kind: 'laravel_resource_scanner';
  readonly closed: true;
  readonly contractVersion: 19;
  readonly semanticJudgmentModel: typeof RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL;
  readonly responseContract: LaravelResourceIntegratedResponseContract;
  /** Canonical semantic authority is bound once at scanner composition, never supplied as per-scan data. */
  readonly bindingAuthority: ResourceModelBindingJudgmentAuthority;
  readonly scan: (input: LaravelResourceScanInput<Evidence>) => Promise<LaravelResourceScanJudgment>;
}

export interface LaravelResourceScanInput<Evidence extends LaravelResourceSourceEvidence<object, object> = LaravelResourceSourceEvidence<object, object>> {
  /** Canonical source project and correlated controller artifacts come from the same closed scan judgment. */
  readonly controllerScan: LaravelControllerScanJudgment;
  /** Canonical definitions are the authority's semantic model candidates. */
  readonly modelDefinitions: readonly ModelDefinition[];
  /** Corresponding canonical ASTs are used only to project an already-resolved model into ResourceAst. */
  readonly modelAsts: readonly ModelAst[];
  /** Complete source-ordered inventory; syntax and relation facts share one source acquisition. */
  readonly resourceEvidence: readonly Evidence[];
}

/** Resolved model judgment is required before constructing a model-bearing resource AST. */
export type ResolvedResourceModelBindingJudgment = Omit<ResourceModelBindingJudgment, 'outcome'> & { readonly outcome: Extract<ResourceModelBindingOutcome, { readonly kind: 'resolved' }> };

export interface LaravelResourceResolvedArtifact {
  readonly kind: 'laravel_resource_resolved_artifact';
  readonly ast: ResourceAst;
  readonly definition: ResourceDefinition;
  readonly modelBinding: ResolvedResourceModelBindingJudgment;
}

/** Preserve unresolved and ambiguous outcomes instead of fabricating a model-bearing AST. */
export interface LaravelResourceRejectedArtifact {
  readonly kind: 'laravel_resource_rejected_artifact';
  readonly resource: ResourceReference;
  readonly source: SourceSpan;
  readonly modelBinding: ResourceModelBindingJudgment;
}

export type LaravelResourceScanArtifact = LaravelResourceResolvedArtifact | LaravelResourceRejectedArtifact;

export interface LaravelResourceIntegratedResponseContract {
  readonly kind: 'laravel_resource_integrated_response_contract';
  readonly bindingJudgment: 'closed_batch_judgment_is_authoritative_before_ast_projection';
  readonly resolvedProjection: 'requires_exact_resolved_candidate_and_canonical_model_ast';
  readonly rejectedProjection: 'preserve_unresolved_or_ambiguous_judgment_without_model_ast';
  readonly ordering: 'preserve_resource_source_evidence_order_across_all_outcomes';
  readonly invocationIntegration: 'retain_complete_controller_scan_and_its_integrated_invocation_response';
  readonly authorityOwnership: 'canonical_resource_model_binding_authority_is_bound_at_scanner_composition-and-is-not-a-per-scan-input';
  readonly batchCorrespondence: 'every-binding-judgment-retains-the-exact-subject-object-and-scanner-matches-by-subject-identity-not-array-position';
  readonly semanticDecisionOwnership: 'binding-outcome-and-fixed-point-closure-are-complete-before-resource-ast-projection';
  readonly scanCompleteness: 'any-rejected-resource-binding-blocks-source-ast-completion-and-retains-the-rejected-artifact';
  readonly closureStateIdentity: 'fixed-point-state-equivalence-is-keyed-by-exact-input-subject-object-identity-not-array-position';
  readonly integratedResponseOwnership: 'one-closed-response-owns-controller-invocation-judgments-binding-closure-and-resource-artifacts-without-detached-sidecars';
  readonly sourceBinding: 'scan_judgment_carries_the_exact_controller_scan_object_used_for_binding';
  readonly responseShape: 'one_source_ordered_artifact_sequence_pairs_each_resource_outcome_with_its_own_binding_judgment';
  readonly provenance: 'candidate_and_relation_evidence_remain_attached_to_judgment';
  /** Shared upstream semantic model; this is a declaration, not a runtime executor. */
  readonly invocationPreservation: ResourceModelBindingInvocationIntegrationModelInterface;
}

export const LARAVEL_RESOURCE_INTEGRATED_RESPONSE_CONTRACT: LaravelResourceIntegratedResponseContract = Object.freeze({
  kind: 'laravel_resource_integrated_response_contract',
  bindingJudgment: 'closed_batch_judgment_is_authoritative_before_ast_projection',
  resolvedProjection: 'requires_exact_resolved_candidate_and_canonical_model_ast',
  rejectedProjection: 'preserve_unresolved_or_ambiguous_judgment_without_model_ast',
  ordering: 'preserve_resource_source_evidence_order_across_all_outcomes',
  invocationIntegration: 'retain_complete_controller_scan_and_its_integrated_invocation_response',
  authorityOwnership: 'canonical_resource_model_binding_authority_is_bound_at_scanner_composition-and-is-not-a-per-scan-input',
  batchCorrespondence: 'every-binding-judgment-retains-the-exact-subject-object-and-scanner-matches-by-subject-identity-not-array-position',
  semanticDecisionOwnership: 'binding-outcome-and-fixed-point-closure-are-complete-before-resource-ast-projection',
  scanCompleteness: 'any-rejected-resource-binding-blocks-source-ast-completion-and-retains-the-rejected-artifact',
  closureStateIdentity: 'fixed-point-state-equivalence-is-keyed-by-exact-input-subject-object-identity-not-array-position',
  integratedResponseOwnership: 'one-closed-response-owns-controller-invocation-judgments-binding-closure-and-resource-artifacts-without-detached-sidecars',
  sourceBinding: 'scan_judgment_carries_the_exact_controller_scan_object_used_for_binding',
  responseShape: 'one_source_ordered_artifact_sequence_pairs_each_resource_outcome_with_its_own_binding_judgment',
  provenance: 'candidate_and_relation_evidence_remain_attached_to_judgment',
  invocationPreservation: RESOURCE_MODEL_BINDING_INVOCATION_INTEGRATION_MODEL,
});

export interface LaravelResourceScanArtifactSequence {
  readonly kind: 'laravel_resource_scan_artifact_sequence';
  readonly items: Sequence<LaravelResourceScanArtifact>;
}

/**
 * The resource response is one closed value. It retains the exact controller scan
 * (including each controller's integrated invocation judgment), the completed binding
 * closure, and the source-ordered resource artifacts together.
 */
export interface LaravelResourceIntegratedResponse<Artifact extends LaravelResourceScanArtifact = LaravelResourceScanArtifact> {
  readonly kind: 'laravel_resource_integrated_response';
  readonly controllerScan: LaravelControllerScanJudgment;
  readonly bindingClosure: ResourceModelBindingBatchClosure;
  readonly artifacts: Readonly<{
    readonly kind: 'laravel_resource_scan_artifact_sequence';
    readonly items: Sequence<Artifact>;
  }>;
}

/**
 * Scan completeness is decided where binding outcomes are produced. The pipeline must not
 * filter rejected artifacts and accidentally publish a complete source-AST projection.
 */
export type LaravelResourceScanJudgment =
  | Readonly<{
      readonly kind: 'laravel_resource_scan_complete';
      readonly contractVersion: 19;
      readonly response: LaravelResourceIntegratedResponse<LaravelResourceResolvedArtifact>;
    }>
  | Readonly<{
      readonly kind: 'laravel_resource_scan_blocked';
      readonly contractVersion: 19;
      readonly response: LaravelResourceIntegratedResponse<LaravelResourceScanArtifact>;
      readonly rejectedArtifacts: readonly LaravelResourceRejectedArtifact[];
    }>;
