import type { SourceCategory, UpstreamStage } from './completeness';
import type { SourceSpan } from './provenance';
import type { SourceProjectIdentity } from './highLevelSourceModel';

/** Closed inventory of runtime stages that may produce or consume a source scan judgment. */
export type SourceScanStage =
  | Readonly<{ readonly kind: 'laravel_source_discovery' }>
  | Readonly<{ readonly kind: 'laravel_attribute_scan' }>
  | Readonly<{ readonly kind: 'laravel_migration_scan' }>
  | Readonly<{ readonly kind: 'laravel_model_scan' }>
  | Readonly<{ readonly kind: 'laravel_request_scan' }>
  | Readonly<{ readonly kind: 'laravel_controller_scan' }>
  | Readonly<{ readonly kind: 'laravel_resource_scan' }>
  | Readonly<{ readonly kind: 'laravel_route_scan' }>
  | Readonly<{ readonly kind: 'laravel_response_scan' }>
  | Readonly<{ readonly kind: 'laravel_dto_scan' }>
  | Readonly<{ readonly kind: 'laravel_channel_scan' }>
  | Readonly<{ readonly kind: 'laravel_service_scan' }>
  | Readonly<{ readonly kind: 'laravel_provider_scan' }>
  | Readonly<{ readonly kind: 'laravel_middleware_scan' }>
  | Readonly<{ readonly kind: 'source_ast_assembly' }>
  | Readonly<{ readonly kind: 'source_ast_completeness' }>
  | Readonly<{ readonly kind: 'source_model_projection' }>
  | Readonly<{ readonly kind: 'manifest_projection' }>
  | Readonly<{ readonly kind: 'manifest_lowering' }>
  | Readonly<{ readonly kind: 'cli_manifest_serialization' }>;

/** Closed set of inputs whose absence prevents a scan from claiming completeness. */
export type SourceScanRequiredInput =
  | Readonly<{ readonly kind: 'project_root' }>
  | Readonly<{ readonly kind: 'source_directory' }>
  | Readonly<{ readonly kind: 'explicitly_selected_source_file' }>
  | Readonly<{ readonly kind: 'source_document' }>
  | Readonly<{ readonly kind: 'scanner_dependency' }>
  | Readonly<{ readonly kind: 'semantic_inventory_receipt' }>
  | Readonly<{ readonly kind: 'source_ast_evidence' }>;

/** Closed vocabulary for unsupported constructs; arbitrary strings are deliberately excluded. */
export type UnsupportedSourceConstructKind =
  | Readonly<{ readonly kind: 'dynamic_source_path' }>
  | Readonly<{ readonly kind: 'unresolved_symbol' }>
  | Readonly<{ readonly kind: 'ambiguous_symbol_binding' }>
  | Readonly<{ readonly kind: 'unsupported_php_syntax' }>
  | Readonly<{ readonly kind: 'unsupported_framework_convention' }>
  | Readonly<{ readonly kind: 'unresolved_route_target' }>
  | Readonly<{ readonly kind: 'unresolved_response_contract' }>;

/** Closed vocabulary for policy blockers; policy failure is not an empty scan. */
export type SourceScanPolicyKind =
  | Readonly<{ readonly kind: 'source_selection_policy' }>
  | Readonly<{ readonly kind: 'symbolic_link_policy' }>
  | Readonly<{ readonly kind: 'route_scan_policy' }>
  | Readonly<{ readonly kind: 'source_coverage_policy' }>;

/** Closed vocabulary for scanner dependencies that can block a result. */
export type SourceScanDependencyKind =
  | Readonly<{ readonly kind: 'filesystem_source_discovery' }>
  | Readonly<{ readonly kind: 'php_source_frontend' }>
  | Readonly<{ readonly kind: 'semantic_inventory' }>
  | Readonly<{ readonly kind: 'schema_producer' }>
  | Readonly<{ readonly kind: 'source_ast_semantic_producer' }>
  | Readonly<{ readonly kind: 'route_response_resolver' }>;

/** Every block reason is a closed ADT with domain evidence, not a string or boolean flag. */
export type SourceScanBlockReason =
  | Readonly<{
      readonly kind: 'source_category_not_scanned';
      readonly category: SourceCategory;
      readonly stage: UpstreamStage;
      readonly source: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'required_scan_input_unavailable';
      readonly input: SourceScanRequiredInput;
      readonly source: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'source_project_identity_mismatch';
      readonly expectedProject: SourceProjectIdentity;
      readonly actualProject: SourceProjectIdentity;
    }>
  | Readonly<{
      readonly kind: 'source_inventory_incomplete';
      readonly category: SourceCategory;
      readonly missingInput: SourceScanRequiredInput;
      readonly source: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'unsupported_source_construct';
      readonly category: SourceCategory;
      readonly construct: UnsupportedSourceConstructKind;
      readonly source: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'scanner_policy_rejected';
      readonly category: SourceCategory;
      readonly policy: SourceScanPolicyKind;
      readonly source: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'scanner_dependency_blocked';
      readonly category: SourceCategory;
      readonly dependency: SourceScanDependencyKind;
      readonly source: SourceSpan;
    }>;

/** Closed proof that the required inventory for this exact scan boundary was enumerated. */
export interface SourceScanInventoryClosureWitness {
  readonly kind: 'source_scan_inventory_closed';
  readonly sourceProject: SourceProjectIdentity;
  readonly category: SourceCategory;
  readonly stage: SourceScanStage;
}

/** Closed proof that scan evidence retains the project identity supplied at the boundary. */
export interface SourceScanProjectIdentityBindingWitness {
  readonly kind: 'source_scan_project_identity_bound';
  readonly sourceProject: SourceProjectIdentity;
}

/** Evidence that the complete payload belongs to the exact project/category/stage scanned. */
export interface SourceScanCompletionWitness {
  readonly kind: 'source_scan_completion_witness';
  readonly contractVersion: 1;
  readonly inventoryClosure: SourceScanInventoryClosureWitness;
  readonly identityBinding: SourceScanProjectIdentityBindingWitness;
}

/** Complete payload is a domain-owned aggregate, not a generic collection encoding. */
export interface SourceScanComplete<Payload> {
  readonly kind: 'source_scan_complete';
  readonly contractVersion: 1;
  readonly sourceProject: SourceProjectIdentity;
  readonly category: SourceCategory;
  readonly stage: SourceScanStage;
  readonly payload: Payload;
  readonly witness: SourceScanCompletionWitness;
}

export interface SourceScanPartialPayload<Payload> {
  readonly kind: 'source_scan_partial_payload';
  readonly payload: Payload;
}

export interface SourceScanNoPartialPayload {
  readonly kind: 'source_scan_no_partial_payload';
}

export type SourceScanPartialEvidence<Payload> =
  | SourceScanPartialPayload<Payload>
  | SourceScanNoPartialPayload;

/** Blocked outcomes preserve project binding, exact stage, typed reason, and partial-evidence status. */
export interface SourceScanBlocked<PartialPayload> {
  readonly kind: 'source_scan_blocked';
  readonly contractVersion: 1;
  readonly sourceProject: SourceProjectIdentity;
  readonly category: SourceCategory;
  readonly stage: SourceScanStage;
  readonly reason: SourceScanBlockReason;
  readonly partialEvidence: SourceScanPartialEvidence<PartialPayload>;
}

export type SourceScanJudgment<CompletePayload, PartialPayload = never> =
  | SourceScanComplete<CompletePayload>
  | SourceScanBlocked<PartialPayload>;

/** Runtime scanner contract: inputs and both outcome payloads remain domain-typed end to end. */
export interface SourceScanRuntimeOperationInterface<Input, CompletePayload, PartialPayload = never> {
  readonly kind: 'source_scan_runtime_operation';
  readonly contractVersion: 1;
  readonly scan: (input: Input) => Promise<SourceScanJudgment<CompletePayload, PartialPayload>>;
}
