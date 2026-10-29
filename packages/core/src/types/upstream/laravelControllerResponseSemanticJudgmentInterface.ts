import type { ResponseContract } from '../domain/responseContracts';
import type { ResponseAst } from './ast';
import type { ResponseDefinition } from './response';
import type { ResponseShape } from '../domain/responseShapes';
import type { ResponseDescriptor } from '../domain/responseDescriptors';
import type { ModelName, ResourceName, ResponseTypeName } from '../domain/semanticValues';
import type { SourceFile } from './names';
import type { StringValue } from './valueObjects';
import type { SourceFileIdentityRelationJudgment } from './sourceProjectIdentity';
import type { LaravelSourceIdentitySemanticsInterface } from './sourceProjectIdentity';
import type {
  LaravelControllerAstProjectionSemanticAuthorityInterface,
  LaravelControllerInvocationSemanticJudgmentInterface,
} from './laravelControllerInvocationSemanticJudgmentInterface';
import type { ControllerDeclarationEvidence, ControllerMethodEvidence, ControllerReturnExpressionEvidence, ControllerResponseAttributeSourceEvidence } from './controllerEvidence';
import type { PhpAstExpressionKind } from './phpAstSyntaxKind';
import type { ControllerActionFlowContract } from './highLevelContracts';
import type { ControllerReturnSemantic } from './controller';
import type { ResponseResult } from './response';
import type { ResourceDefinition } from './resource';
import type { TypeExpression } from './typeVocabulary';
import type { ResponseReference } from './semanticReferences';
import type { SourceSpan } from './provenance';
import type { ControllerActionJudgmentPublication } from './laravelControllerScannerInterface';
import type { LaravelProjectDtoDeclarationInventoryInterface, LaravelControllerResponseDtoDeclarationResolutionJudgment } from './laravelControllerResponseDtoDeclarationInterface';
import type { LaravelDtoResponseContractProjectionJudgment } from './laravelDtoResponseContractProjectionInterface';
import type { LaravelDtoPropertyTypeReferenceBindingEvidence, LaravelDtoTypeReferenceBindingAuthorityInterface } from './laravelDtoTypeReferenceBindingInterface';
import type { PhpClassNameResolutionRuleInterface } from './phpClassNameResolutionInterface';
import type { LaravelDtoResponseContractProjectionAuthorityInterface } from './laravelDtoResponseContractProjectionInterface';

type CompleteLaravelDtoDeclarationInventory = Extract<
  LaravelProjectDtoDeclarationInventoryInterface,
  { readonly kind: 'laravel_project_dto_declaration_inventory_complete' }
>;

/**
 * Dependencies consumed by the existing integrated response pipeline.
 * This is a composition contract, not a second semantic authority: each member
 * is an already-existing upstream authority and retains its own judgment type.
 */
export interface LaravelControllerResponseSemanticPipelineDependenciesInterface {
  readonly kind: 'laravel_controller_response_semantic_pipeline_dependencies';
  /** The response meaning owner also owns the identity semantics used to correlate and bind its evidence. */
  readonly responseSemanticAuthority: LaravelControllerResponseSemanticJudgmentAuthorityInterface;
  readonly dtoTypeReferenceBindingAuthority: LaravelDtoTypeReferenceBindingAuthorityInterface;
  readonly dtoResponseContractProjectionAuthority: LaravelDtoResponseContractProjectionAuthorityInterface;
  /** Evidence production is selected by the composition root, never captured as a hidden module dependency. */
  readonly evidenceProduction: LaravelControllerResponseEvidenceProductionInterface;
  /** Method AST projection owns the exact output-type judgment it executes. */
  readonly methodResponseAstProjection: LaravelControllerMethodResponseAstProjectionInterface;
  readonly astProjectionAuthority: LaravelControllerAstProjectionSemanticAuthorityInterface;
}

/** Canonical response meaning. Legacy descriptors are evidence, never the semantic result. */
export type LaravelControllerResponseSemanticProduct =
  | Readonly<{
      /** Concrete HTTP-result projection for every declared method when all return ADTs prove a result. */
      readonly kind: 'controller_method_response_products';
      readonly firstMethod: LaravelControllerMethodResponseProduct;
      readonly remainingMethods: readonly LaravelControllerMethodResponseProduct[];
    }>
  | Readonly<{
      /** Existing canonical method-return ADT, preserved without a second syntax classifier. */
      readonly kind: 'controller_method_return_semantics';
      readonly methods: readonly [LaravelControllerMethodReturnSemantic, ...LaravelControllerMethodReturnSemantic[]];
    }>
  | Readonly<{
      readonly kind: 'object_response';
      readonly contract: ResponseContract;
    }>
  | Readonly<{
      readonly kind: 'model_response';
      readonly model: ModelName;
      readonly shape: ResponseShape;
      readonly responseType: ResponseTypeName;
    }>
  | Readonly<{
      readonly kind: 'resource_response';
      readonly resource: ResourceName;
      readonly shape: ResponseShape;
      readonly responseType: ResponseTypeName;
    }>
  | Readonly<{
      readonly kind: 'void_response';
      readonly shape: ResponseShape;
      readonly responseType: ResponseTypeName;
    }>;

/** Method-scoped semantic return product sourced from the existing canonical ControllerReturnSemantic ADT. */
export type LaravelControllerMethodReturnSemantic = Readonly<{
  readonly kind: 'controller_method_return_semantic';
  readonly methodEvidence: ControllerMethodEvidence;
  readonly action: ControllerActionFlowContract;
  readonly source: SourceSpan;
  readonly returned: ControllerReturnSemantic;
}>;

/** A method response result is admitted only when the canonical return ADT proves its HTTP result. */
export type LaravelControllerMethodResponseProduct = Readonly<{
  readonly kind: 'controller_method_response_product';
  readonly method: LaravelControllerMethodReturnSemantic;
  readonly result: ResponseResult;
  /** DTO response contracts resolved for this exact method owner; never an aggregate pipeline-wide bag. */
  readonly dtoResponseContracts: readonly LaravelDtoResponseContractProjectionJudgment[];
}>;

/** Lock-file facts acquired by the scanner; this evidence does not itself decide framework compatibility. */
export type LaravelFrameworkVersionLockEvidence =
  | Readonly<{ readonly kind: 'laravel_framework_lock_unavailable' }>
  | Readonly<{ readonly kind: 'laravel_framework_lock_invalid' }>
  | Readonly<{ readonly kind: 'laravel_framework_package_not_locked' }>
  | Readonly<{ readonly kind: 'laravel_framework_version_candidate'; readonly version: StringValue; readonly sourceFile: SourceFile }>;

export interface LaravelFrameworkVersionCompatibilityJudgmentInput {
  readonly kind: 'laravel_framework_version_compatibility_judgment_input';
  readonly evidence: LaravelFrameworkVersionLockEvidence;
}

export interface LaravelFrameworkVersionCompatibilityJudgmentContract {
  readonly kind: 'laravel_framework_version_compatibility_judgment_contract';
  readonly contractVersion: 1;
  readonly owner: 'LaravelControllerPaginationMetadataProfileInterface';
  readonly evidenceRule: 'scanner-acquires-lock-file-facts-only;framework-version-compatibility-is-decided-by-this-contract';
  readonly versionRule: 'only-a-recognized-stable-semver-version-with-major-12-is-proven-compatible-with-the-verified-default-pagination-metadata-profile';
  readonly unresolvedRule: 'missing-invalid-absent-unrecognized-prerelease-and-out-of-contract-version-evidence-remain-unresolved';
}

export interface LaravelFrameworkVersionCompatibilityJudgmentInterface {
  readonly kind: 'laravel_framework_version_compatibility_judgment';
  readonly contract: LaravelFrameworkVersionCompatibilityJudgmentContract;
  readonly judge: (input: LaravelFrameworkVersionCompatibilityJudgmentInput) => LaravelFrameworkVersionCompatibility;
}

/** Closed AST projection of a canonical method response product; it never reparses PHP return syntax. */
export type LaravelFrameworkVersionCompatibility =
  | Readonly<{
      readonly kind: 'laravel_framework_version_contract_proven';
      readonly major: '12';
      readonly version: StringValue;
      readonly sourceFile: SourceFile;
      readonly contract: 'laravel-paginated-resource-response-default-metadata-v1';
    }>
  | Readonly<{
      readonly kind: 'laravel_framework_version_contract_unresolved';
      readonly reason: 'composer-lock-unavailable' | 'composer-lock-invalid' | 'laravel-framework-package-not-locked' | 'laravel-framework-version-unrecognized' | 'laravel-framework-version-outside-verified-contract';
    }>;

export type LaravelControllerPaginationMetadataProfileJudgment =
  | Readonly<{
      readonly kind: 'controller_pagination_metadata_profile_proven';
      readonly pagination: import('./response').PaginationKind;
      readonly links: TypeExpression;
      readonly meta: TypeExpression;
      readonly source: SourceSpan;
      readonly frameworkContract: 'laravel-paginated-resource-response-default-metadata-v1';
      readonly frameworkVersion: Extract<LaravelFrameworkVersionCompatibility, { readonly kind: 'laravel_framework_version_contract_proven' }>;
    }>
  | Readonly<{
      readonly kind: 'controller_pagination_metadata_profile_unresolved';
      readonly reason: 'pagination-kind-not-supported-by-framework-contract' | 'framework-version-not-proven-compatible';
    }>;

export interface LaravelControllerPaginationMetadataProfileInput {
  readonly kind: 'laravel_controller_pagination_metadata_profile_input';
  readonly pagination: import('./response').PaginationKind;
  readonly source: SourceSpan;
  readonly frameworkVersion: LaravelFrameworkVersionCompatibility;
}

export interface LaravelControllerPaginationMetadataProfileContract {
  readonly kind: 'laravel_controller_pagination_metadata_profile_contract';
  readonly contractVersion: 3;
  readonly owner: 'LaravelControllerResponsePaginationEnvelopeJudgmentInterface';
  readonly frameworkContract: 'laravel-paginated-resource-response-default-metadata-v1';
  readonly frameworkVersionRule: 'profile-is-proven-only-after-LaravelControllerPaginationMetadataProfileInterface.frameworkVersionCompatibility-judges-lock-evidence-as-verified-Laravel-12.x';
  readonly metadataRule: 'metadata-fields-are-derived-from-the-canonical-pagination-ADT-under-the-framework-default-contract-not-from-inferred-runtime-values';
  readonly provenanceRule: 'every-projected-links-and-meta-property-retains-the-exact-owning-method-source-span';
  readonly customizationRule: 'profile-is-admissible-only-after-resource-pagination-customization-is-proven-absent-by-the-parent-envelope-judgment';
}

export interface LaravelControllerPaginationMetadataProfileInterface {
  readonly kind: 'laravel_controller_pagination_metadata_profile';
  readonly contract: LaravelControllerPaginationMetadataProfileContract;
  /** Framework compatibility is judged here before the metadata profile can be proven. */
  readonly frameworkVersionCompatibility: LaravelFrameworkVersionCompatibilityJudgmentInterface;
  readonly project: (input: LaravelControllerPaginationMetadataProfileInput) => LaravelControllerPaginationMetadataProfileJudgment;
}

export type LaravelControllerResponsePaginationEnvelopeJudgment =
  | Readonly<{
      readonly kind: 'controller_response_pagination_envelope_proven';
      readonly output: TypeExpression;
      readonly metadataProfile: Extract<LaravelControllerPaginationMetadataProfileJudgment, { readonly kind: 'controller_pagination_metadata_profile_proven' }>;
    }>
  | Readonly<{ readonly kind: 'controller_response_pagination_envelope_unresolved'; readonly reason: 'pagination-payload-output-type-unresolved' | 'resource-pagination-output-shape-not-closed' | 'pagination-kind-not-supported' | 'framework-version-not-proven-compatible' }>;

export interface LaravelControllerResponsePaginationEnvelopeInput {
  readonly kind: 'laravel_controller_response_pagination_envelope_input';
  readonly result: ResponseResult;
  readonly resourceDefinitions: readonly ResourceDefinition[];
  readonly source: SourceSpan;
  readonly frameworkVersion: LaravelFrameworkVersionCompatibility;
}

export interface LaravelControllerResponsePaginationEnvelopeContract {
  readonly kind: 'laravel_controller_response_pagination_envelope_contract';
  readonly contractVersion: 3;
  readonly owner: 'LaravelControllerResponseOutputTypeJudgmentInterface';
  readonly metadataProfileRule: 'pagination-links-and-meta-are-projected-by-the-framework-metadata-profile-contract';
  readonly frameworkEnvelopeRule: 'paginate-emits-data-links-meta;simple-paginate-emits-data-links-and-page-meta;cursor-paginate-emits-data-links-and-cursor-meta';
  readonly customizationRule: 'resource-paginationInformation-customization-must-be-absent-and-resource-data-shape-must-already-be-closed';
  readonly unresolvedRule: 'unresolved-payload-or-unproven-customization-never-produces-a-proven-envelope';
  readonly frameworkVersionRule: 'metadata-envelope-is-proven-only-for-the-explicitly-verified-Laravel-framework-major';
}

export interface LaravelControllerResponsePaginationEnvelopeJudgmentInterface {
  readonly kind: 'laravel_controller_response_pagination_envelope_judgment';
  readonly contract: LaravelControllerResponsePaginationEnvelopeContract;
  readonly metadataProfile: LaravelControllerPaginationMetadataProfileInterface;
  readonly judge: (input: LaravelControllerResponsePaginationEnvelopeInput) => LaravelControllerResponsePaginationEnvelopeJudgment;
}

export type LaravelControllerResponseOutputTypeJudgment =
  | Readonly<{ readonly kind: 'controller_response_output_type_proven'; readonly result: ResponseResult; readonly output: TypeExpression }>
  | Readonly<{ readonly kind: 'controller_response_output_type_unresolved'; readonly result: ResponseResult; readonly reason: 'payload-type-is-not-proven-by-canonical-response-result' | 'at-least-one-response-branch-has-no-proven-output-type' | 'resource-schema-is-not-closed' | 'pagination-envelope-is-not-closed' | 'pagination-payload-output-type-unresolved' | 'resource-pagination-output-shape-not-closed' | 'pagination-kind-not-supported' | 'framework-version-not-proven-compatible' }>;

export interface LaravelControllerResponseOutputTypeJudgmentContract {
  readonly kind: 'laravel_controller_response_output_type_judgment_contract';
  readonly contractVersion: 5;
  readonly owner: 'canonical-ResponseResult-ADT';
  readonly directTypeRule: 'responsable-json-serializable-explicit-json-payload-types-and-closed-resolved-resource-fields-preserve-their-proven-TypeExpression';
  readonly branchRule: 'branch-output-type-is-proven-only-when-every-branch-has-a-proven-output-type';
  readonly paginationEnvelopeRule: 'pagination-output-is-a-closed-data-links-meta-object-only-when-payload-and-resource-customization-evidence-are-closed';
  readonly paginationMetadataRule: 'links-and-meta-are-projected-by-the-versioned-framework-metadata-profile-contract-from-the-canonical-PaginationKind';
  readonly unresolvedRule: 'redirect-resource-schema-without-unique-closed-definition-untyped-expression-empty-and-unknown-payload-shapes-remain-unresolved-rather-than-being-promoted-to-mixed-as-a-semantic-judgment';
}

export interface LaravelControllerResponseOutputTypeInput {
  readonly kind: 'laravel_controller_response_output_type_input';
  readonly result: ResponseResult;
  /** Only resolved, canonical resource definitions are admitted as output-shape evidence. */
  readonly resourceDefinitions: readonly ResourceDefinition[];
  /** The exact method span is the provenance for framework-owned envelope fields. */
  readonly source: SourceSpan;
  readonly frameworkVersion: LaravelFrameworkVersionCompatibility;
}

export interface LaravelControllerResponseOutputTypeJudgmentInterface {
  readonly kind: 'laravel_controller_response_output_type_judgment';
  readonly contract: LaravelControllerResponseOutputTypeJudgmentContract;
  readonly paginationEnvelope: LaravelControllerResponsePaginationEnvelopeJudgmentInterface;
  readonly judge: (input: LaravelControllerResponseOutputTypeInput) => LaravelControllerResponseOutputTypeJudgment;
}

export interface LaravelControllerMethodResponseAstProjectionInput {
  readonly kind: 'laravel_controller_method_response_ast_projection_input';
  readonly product: LaravelControllerMethodResponseProduct;
  /** Canonical publications from the same controller artifact; projection owns method correlation. */
  readonly actionJudgments: readonly ControllerActionJudgmentPublication[];
  readonly resourceDefinitions: readonly ResourceDefinition[];
  readonly frameworkVersion: LaravelFrameworkVersionCompatibility;
}

export type LaravelControllerMethodResponseAstProjectionJudgment =
  | Readonly<{
      readonly kind: 'controller_method_response_ast_projection_complete';
      readonly product: LaravelControllerMethodResponseProduct;
      readonly actionJudgment: ControllerActionJudgmentPublication;
      readonly outputTypeJudgment: LaravelControllerResponseOutputTypeJudgment;
      readonly definition: ResponseDefinition;
      readonly ast: ResponseAst;
    }>
  | Readonly<{
      readonly kind: 'controller_method_response_action_correlation_rejected';
      readonly product: LaravelControllerMethodResponseProduct;
      readonly actionJudgments: readonly ControllerActionJudgmentPublication[];
      readonly reason: 'no_matching_action_judgment' | 'ambiguous_action_judgments';
    }>;

export interface LaravelControllerMethodResponseAstProjectionContract {
  readonly kind: 'laravel_controller_method_response_ast_projection_contract';
  readonly contractVersion: 4;
  readonly owner: 'LaravelControllerResponseSemanticPipelineInterface';
  readonly resultRule: 'ResponseDefinition.outcome.success.result-preserves-the-exact-canonical-ResponseResult-from-the-method-product';
  readonly provenanceRule: 'ResponseDefinition.source-is-the-exact-source-span-of-the-method-owning-the-canonical-return-semantic';
  readonly actionCorrelationRule: 'method-response-AST-projection-requires-exactly-one-canonical-action-publication-matching-action-identity-and-source-span;missing-or-ambiguous-correlation-is-an-explicit-rejected-judgment';
  readonly dtoContractProvenanceRule: 'AST-projection-preserves-the-exact-method-product-including-its-method-owned-DTO-response-contract-judgments-without-rejoining-by-source-span';
  readonly identityRule: 'response-type-name-is-derived-from-the-canonical-action-name-with-a-deterministic-Response-suffix';
  readonly outputTypeRule: 'ResponseDefinition.output-uses-a-proven-TypeExpression-only-when-the-canonical-ResponseResult-output-type-judgment-is-complete;otherwise-mixed-is-retained-as-an-explicit-unresolved-fallback';
  readonly noReclassificationRule: 'projection-does-not-read-PHP-syntax-or-call-the-legacy-controller-response-classifier';
  readonly resourceShapeRule: 'resource-definitions-are-canonical-resolved-upstream-inputs;resource-output-is-proven-only-for-a-unique-closed-resource-definition';
  readonly paginationRule: 'paginated-output-remains-unresolved-until-the-framework-envelope-and-customization-contract-are-closed';
}

export interface LaravelControllerMethodResponseAstProjectionInterface {
  readonly kind: 'laravel_controller_method_response_ast_projection';
  readonly contract: LaravelControllerMethodResponseAstProjectionContract;
  /** The projection and its output-type authority are one composed contract. */
  readonly outputTypeJudgment: LaravelControllerResponseOutputTypeJudgmentInterface;
  readonly project: (input: LaravelControllerMethodResponseAstProjectionInput) => LaravelControllerMethodResponseAstProjectionJudgment;
}

export type LaravelControllerReturnResponseProjectionJudgment =
  | Readonly<{ readonly kind: 'controller_return_response_projection_complete'; readonly returned: ControllerReturnSemantic; readonly result: ResponseResult }>
  | Readonly<{ readonly kind: 'controller_return_response_projection_unresolved'; readonly returned: ControllerReturnSemantic; readonly reason: 'absent-or-generic-expression-does-not-prove-an-http-response-result' | 'at-least-one-branch-has-no-concrete-http-response-result' }>;

export interface LaravelControllerReturnResponseProjectionContract {
  readonly kind: 'laravel_controller_return_response_projection_contract';
  readonly contractVersion: 1;
  readonly owner: 'existing-ControllerReturnSemantic-ADT';
  readonly completeRule: 'response-resource-model-and-fully-projectable-branches-map-to-ResponseResult-without-reading-PHP-syntax';
  readonly unresolvedRule: 'absent-generic-expression-or-any-unresolved-branch-remains-unresolved-and-is-never-guessed-as-empty-or-JSON';
  readonly branchRule: 'all-branches-must-project-to-concrete-ResponseResult-before-the-branch-result-is-complete';
}

export interface LaravelControllerReturnResponseProjectionInterface {
  readonly kind: 'laravel_controller_return_response_projection';
  readonly contract: LaravelControllerReturnResponseProjectionContract;
  readonly project: (returned: ControllerReturnSemantic) => LaravelControllerReturnResponseProjectionJudgment;
}

/** Source evidence retained until a response judgment is closed. */
export type LaravelControllerResponseSemanticEvidence =
  | Readonly<{
      readonly kind: 'declared_response_attribute';
      readonly sourceFile: SourceFile;
      readonly descriptor: Extract<ResponseDescriptor, { readonly kind: 'inline' }>;
    }>
  | Readonly<{
      /** Direct source syntax for the response attribute; not a resolved DTO descriptor or HTTP result. */
      readonly kind: 'response_attribute_source';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly attribute: ControllerResponseAttributeSourceEvidence;
    }>
  | Readonly<{
      /** Direct parser evidence that a PHP return expression exists; not yet a response product. */
      readonly kind: 'observed_controller_return';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly expressionSource: SourceSpan;
      readonly expressionKind: PhpAstExpressionKind;
    }>
  | Readonly<{
      /** A response-reference candidate projected from the controller-action descriptor, not direct proof of a PHP return expression. */
      readonly kind: 'controller_action_response_reference_candidate';
      readonly origin: 'controller-action-descriptor-response-type';
      readonly sourceFile: SourceFile;
      readonly source: SourceSpan;
      readonly response: ResponseReference;
    }>
  | Readonly<{
      readonly kind: 'response_dto_declaration';
      readonly sourceFile: SourceFile;
      readonly contract: ResponseContract;
    }>
  | Readonly<{
      /** Project-scoped DTO judgment is retained as semantic context, not controller-local source evidence. */
      readonly kind: 'response_dto_declaration_resolution_judgment';
      readonly judgment: LaravelControllerResponseDtoDeclarationResolutionJudgment;
    }>
  | Readonly<{
      /** Property-level class-reference binding is retained separately from controller-local source binding. */
      readonly kind: 'response_dto_property_type_reference_binding_judgment';
      readonly evidence: LaravelDtoPropertyTypeReferenceBindingEvidence;
    }>
  | Readonly<{
      /** DTO-to-ResponseContract projection remains project-context evidence, not controller-local source evidence. */
      readonly kind: 'response_dto_contract_projection_judgment';
      readonly judgment: LaravelDtoResponseContractProjectionJudgment;
    }>;

/** A blocked response is not replaced by a guessed empty/object response. */
export type LaravelControllerResponseSemanticBlocker =
  | Readonly<{ readonly kind: 'response_evidence_source_binding_unproven' }>
  | Readonly<{ readonly kind: 'response_evidence_source_binding_rejected' }>
  | Readonly<{ readonly kind: 'response_contract_unresolved' }>
  | Readonly<{ readonly kind: 'response_evidence_ambiguous' }>
  | Readonly<{ readonly kind: 'response_dto_declaration_unresolved' }>
  | Readonly<{ readonly kind: 'response_dto_property_type_reference_unresolved' }>
  | Readonly<{ readonly kind: 'response_dto_contract_projection_unresolved' }>
  | Readonly<{ readonly kind: 'response_shape_unsupported' }>;

type LaravelControllerResponseSemanticJudgmentForOne<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface,
> = InvocationJudgment extends Readonly<{
  readonly response: { readonly kind: 'php_source_invocation_integration_not_connected' };
}>
  ? Readonly<{
      readonly kind: 'controller_response_invocation_not_connected';
      readonly invocationJudgment: InvocationJudgment;
    }>
  : InvocationJudgment extends Readonly<{
      readonly response: { readonly kind: 'php_source_invocation_integration_source_binding_rejected' };
    }>
    ? Readonly<{
        readonly kind: 'controller_response_source_binding_rejected';
        readonly invocationJudgment: InvocationJudgment;
      }>
    : InvocationJudgment extends Readonly<{
        readonly response: { readonly kind: 'php_source_invocation_integration_blocked' };
      }>
      ? Readonly<{
          readonly kind: 'controller_response_invocation_blocked';
          readonly invocationJudgment: InvocationJudgment;
          readonly evidence: readonly LaravelControllerResponseSemanticEvidence[];
          readonly blocker: LaravelControllerResponseSemanticBlocker;
        }>
      : InvocationJudgment extends Readonly<{
          readonly response: { readonly kind: 'php_source_invocation_integration_complete' };
        }>
        ? Readonly<
            | {
                readonly kind: 'controller_response_complete';
                readonly invocationJudgment: InvocationJudgment;
                readonly evidence: readonly [LaravelControllerResponseSemanticEvidence, ...LaravelControllerResponseSemanticEvidence[]];
                readonly product: LaravelControllerResponseSemanticProduct;
              }
            | {
                readonly kind: 'controller_response_method_products_complete';
                readonly invocationJudgment: InvocationJudgment;
                readonly evidence: readonly [LaravelControllerResponseSemanticEvidence, ...LaravelControllerResponseSemanticEvidence[]];
                readonly product: Extract<LaravelControllerResponseSemanticProduct, { readonly kind: 'controller_method_response_products' }>;
              }
            | {
                readonly kind: 'controller_response_return_semantics_complete';
                readonly invocationJudgment: InvocationJudgment;
                readonly evidence: readonly [LaravelControllerResponseSemanticEvidence, ...LaravelControllerResponseSemanticEvidence[]];
                readonly product: Extract<LaravelControllerResponseSemanticProduct, { readonly kind: 'controller_method_return_semantics' }>;
              }
            | {
                readonly kind: 'controller_response_blocked';
                readonly invocationJudgment: InvocationJudgment;
                readonly evidence: readonly LaravelControllerResponseSemanticEvidence[];
                readonly blocker: LaravelControllerResponseSemanticBlocker;
              }
          >
        : never;

/**
 * Distributes over the canonical invocation ADT so each response outcome retains
 * the exact invocation subtype admitted by its parent controller artifact.
 */
export type LaravelControllerResponseSemanticJudgmentFor<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> = InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface
  ? LaravelControllerResponseSemanticJudgmentForOne<InvocationJudgment>
  : never;

/** Complete closed response ADT for consumers that do not need one narrowed invocation subtype. */
export type LaravelControllerResponseSemanticJudgment = LaravelControllerResponseSemanticJudgmentFor;

/**
 * Evidence shape whose source endpoint is indexed by the invocation subject.
 * The source-identity authority must still validate value identity; TypeScript
 * structural compatibility alone is not a runtime provenance proof.
 */
export type LaravelControllerResponseSemanticEvidenceForSource<Source extends SourceFile> =
  | (Omit<Extract<LaravelControllerResponseSemanticEvidence, { readonly kind: 'declared_response_attribute' }>, 'sourceFile'> & Readonly<{ readonly sourceFile: Source }>)
  | (Omit<Extract<LaravelControllerResponseSemanticEvidence, { readonly kind: 'response_attribute_source' }>, 'sourceFile'> & Readonly<{ readonly sourceFile: Source }>)
  | (Omit<Extract<LaravelControllerResponseSemanticEvidence, { readonly kind: 'observed_controller_return' }>, 'sourceFile'> & Readonly<{ readonly sourceFile: Source }>)
  | (Omit<Extract<LaravelControllerResponseSemanticEvidence, { readonly kind: 'controller_action_response_reference_candidate' }>, 'sourceFile'> & Readonly<{ readonly sourceFile: Source }>)
  | (Omit<Extract<LaravelControllerResponseSemanticEvidence, { readonly kind: 'response_dto_declaration' }>, 'sourceFile'> & Readonly<{ readonly sourceFile: Source }>);

/** One response evidence item paired with the existing source-identity judgment. */
export type LaravelControllerResponseEvidenceSourceBindingEntry<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> =
  | Readonly<{
      readonly kind: 'response_evidence_same_source';
      readonly observation: LaravelControllerResponseEvidenceProductionObservation;
      readonly evidence: LaravelControllerResponseSemanticEvidenceForSource<InvocationJudgment['sourceFile']>;
      readonly identityJudgment: Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'same_source_file_identity' }>;
    }>
  | Readonly<{
      readonly kind: 'response_evidence_different_source';
      readonly observation: LaravelControllerResponseEvidenceProductionObservation;
      readonly evidence: LaravelControllerResponseSemanticEvidence;
      readonly identityJudgment: Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'different_source_file_identity' }>;
    }>;

type LaravelControllerResponseEvidenceSameSourceEntry<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface,
> = Extract<LaravelControllerResponseEvidenceSourceBindingEntry<InvocationJudgment>, { readonly kind: 'response_evidence_same_source' }>;
type LaravelControllerResponseEvidenceDifferentSourceEntry<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface,
> = Extract<LaravelControllerResponseEvidenceSourceBindingEntry<InvocationJudgment>, { readonly kind: 'response_evidence_different_source' }>;

/**
 * Closed source-binding ADT. A complete receipt requires at least one evidence
 * item and every entry must be same-source. A rejected receipt requires at least
 * one explicitly different-source entry, while preserving any other evidence
 * entries (including same-source entries) in the same receipt.
 */
export type LaravelControllerResponseEvidenceSourceBindingJudgment<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> =
  | Readonly<{
      readonly kind: 'controller_response_evidence_source_binding_complete';
      readonly invocationSource: InvocationJudgment['sourceFile'];
      /** Same-project DTO context; not part of the invocation-file evidence tuple. */
      readonly dtoDeclarationInventory: CompleteLaravelDtoDeclarationInventory;
      readonly observations: readonly LaravelControllerResponseEvidenceProductionObservation[];
      readonly evidence: readonly [
        LaravelControllerResponseEvidenceSameSourceEntry<InvocationJudgment>,
        ...LaravelControllerResponseEvidenceSameSourceEntry<InvocationJudgment>[],
      ];
      readonly coverage: 'every-response-evidence-item-is-represented-exactly-once';
    }>
  | Readonly<{
      readonly kind: 'controller_response_evidence_source_binding_rejected';
      readonly invocationSource: InvocationJudgment['sourceFile'];
      /** Same-project DTO context; not part of the invocation-file evidence tuple. */
      readonly dtoDeclarationInventory: CompleteLaravelDtoDeclarationInventory;
      readonly observations: readonly LaravelControllerResponseEvidenceProductionObservation[];
      readonly evidence: readonly [
        LaravelControllerResponseEvidenceDifferentSourceEntry<InvocationJudgment>,
        ...LaravelControllerResponseEvidenceSourceBindingEntry<InvocationJudgment>[],
      ];
      readonly coverage: 'every-response-evidence-item-is-represented-exactly-once';
    }>
  | Readonly<{
      readonly kind: 'controller_response_evidence_source_binding_empty';
      readonly invocationSource: InvocationJudgment['sourceFile'];
      /** Same-project DTO context; not part of the invocation-file evidence tuple. */
      readonly dtoDeclarationInventory: CompleteLaravelDtoDeclarationInventory;
      readonly observations: readonly LaravelControllerResponseEvidenceProductionObservation[];
      readonly evidence: readonly [];
      readonly coverage: 'every-response-evidence-item-is-represented-exactly-once';
    }>;

/**
 * Evidence inventory supplied to the source-binding authority. Empty and
 * non-empty inventories are distinct input ADT members, so an empty inventory
 * cannot accidentally enter the complete-binding path. The DTO inventory is
 * retained as project-scoped context; it is not an evidence item and is not
 * required to share the invocation controller's exact source file.
 */
export type LaravelControllerResponseEvidenceSourceBindingInput<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> = LaravelControllerResponseEvidenceProductionInventory<InvocationJudgment>;

/**
 * Contract input for producing response evidence from the already-parsed
 * controller declaration. The boundary retains direct return observations,
 * response-attribute syntax evidence, and descriptor-derived reference candidates.
 * It cannot resolve a DTO declaration or promote a ResponseReference into a
 * resolved response product without the missing typed DTO inventory.
 */
export type LaravelControllerResponseReferenceCandidateEvidence = Extract<
  LaravelControllerResponseSemanticEvidence,
  Readonly<{ readonly kind: 'controller_action_response_reference_candidate' }>
>;

/** Response evidence admitted by the producer; direct return observations and descriptor candidates remain distinct. */
export type LaravelControllerResponseEvidenceProductionEvidence = Extract<
  LaravelControllerResponseSemanticEvidence,
  Readonly<{ readonly kind: 'observed_controller_return' | 'controller_action_response_reference_candidate' | 'response_attribute_source' }>
>;

/**
 * Evidence production remains partial: parsed response-attribute syntax crosses
 * this boundary, while the integrated pipeline separately composes class-name
 * and DTO declaration judgments. DTO-to-response-contract projection is composed
 * by the integrated pipeline; descriptor resolution remains open, so syntax is never
 * mistaken for a complete response contract.
 */
export type LaravelControllerResponseEvidenceProductionCoverage = Readonly<{
  readonly kind: 'response_evidence_production_partial';
  readonly producedEvidence: readonly ['observed_controller_return', 'controller_action_response_reference_candidate', 'response_attribute_source'];
  readonly missingEvidence: readonly ['resolved_response_attribute_descriptor', 'response_dto_declaration'];
  readonly currentOwner: 'legacy_controller_action_contract_and_response_attribute_scanner';
  readonly targetOwner: 'existing_LaravelControllerResponseEvidenceProductionInterface';
  readonly closure: 'parsed-response-attribute-source-enters-through-the-existing-producer;the-integrated-pipeline-runs-existing-PHP-class-name-and-DTO-declaration-authorities;binds-class-typed-properties;and-projects-resolved-response-DTOs-through-the-existing-projection-interface;resolved-response-attribute-descriptor-remains-open-before-legacy-descriptor-derivation-can-be-retired';
}>;

/** One canonical observation per declared method, retaining both parser returns and descriptor evidence. */
export type LaravelControllerResponseEvidenceProductionObservation = Readonly<{
  readonly kind: 'controller_method_response_observation';
  readonly methodEvidence: ControllerMethodEvidence;
  readonly action: ControllerActionFlowContract;
  readonly returnExpressions: readonly ControllerReturnExpressionEvidence[];
  readonly evidence: readonly LaravelControllerResponseEvidenceProductionEvidence[];
}>;

export type LaravelControllerResponseEvidenceProductionInventory<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> =
  | Readonly<{
      readonly kind: 'response_evidence_inventory_empty';
      readonly invocationJudgment: InvocationJudgment;
      readonly sourceCorrelation: LaravelControllerResponseEvidenceProductionSourceCorrelation<InvocationJudgment>;
      /** Same-project DTO context; not part of the invocation-file evidence tuple. */
      readonly dtoDeclarationInventory: CompleteLaravelDtoDeclarationInventory;
      readonly observations: readonly LaravelControllerResponseEvidenceProductionObservation[];
      readonly evidence: readonly [];
      readonly coverage: LaravelControllerResponseEvidenceProductionCoverage;
    }>
  | Readonly<{
      readonly kind: 'response_evidence_inventory_present';
      readonly invocationJudgment: InvocationJudgment;
      readonly sourceCorrelation: LaravelControllerResponseEvidenceProductionSourceCorrelation<InvocationJudgment>;
      /** Same-project DTO context; not part of the invocation-file evidence tuple. */
      readonly dtoDeclarationInventory: CompleteLaravelDtoDeclarationInventory;
      readonly observations: readonly [
        LaravelControllerResponseEvidenceProductionObservation,
        ...LaravelControllerResponseEvidenceProductionObservation[],
      ];
      readonly evidence: readonly [
        LaravelControllerResponseEvidenceProductionEvidence,
        ...LaravelControllerResponseEvidenceProductionEvidence[],
      ];
      readonly coverage: LaravelControllerResponseEvidenceProductionCoverage;
    }>;

/**
 * Declaration-level source correlation required before response observations can
 * be produced. The receipt records both operands; the identity judgment is owned
 * by LaravelSourceIdentitySemanticsInterface, never by the producer.
 */
export type LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> =
  | Readonly<{
      readonly kind: 'controller_response_evidence_declaration_source_correlated';
      readonly invocationSource: InvocationJudgment['sourceFile'];
      readonly declarationSource: ControllerDeclarationEvidence['source']['file'];
      readonly identityJudgment: Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'same_source_file_identity' }>;
    }>
  | Readonly<{
      readonly kind: 'controller_response_evidence_declaration_source_correlation_rejected';
      readonly invocationSource: InvocationJudgment['sourceFile'];
      readonly declarationSource: ControllerDeclarationEvidence['source']['file'];
      readonly identityJudgment: Extract<SourceFileIdentityRelationJudgment, { readonly kind: 'different_source_file_identity' }>;
    }>;

/**
 * Explicit artifact-safe rejection when the declaration source does not match
 * the exact invocation source. This judgment is terminal for evidence production:
 * it retains the original invocation and rejected identity receipt without
 * fabricating an evidence inventory or response product.
 */
export type LaravelControllerResponseEvidenceProductionSourceCorrelationRejectedJudgment<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> = Readonly<{
  readonly kind: 'controller_response_declaration_source_correlation_rejected';
  readonly invocationJudgment: InvocationJudgment;
  readonly sourceCorrelation: Extract<
    LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment<InvocationJudgment>,
    { readonly kind: 'controller_response_evidence_declaration_source_correlation_rejected' }
  >;
}>;

/** Successful correlation receipt accepted by evidence production. */
export type LaravelControllerResponseEvidenceProductionSourceCorrelation<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> = Extract<
  LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment<InvocationJudgment>,
  { readonly kind: 'controller_response_evidence_declaration_source_correlated' }
>;

export interface LaravelControllerResponseEvidenceProductionInput<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> {
  readonly kind: 'laravel_controller_response_evidence_production_input';
  readonly invocationJudgment: InvocationJudgment;
  readonly declarationEvidence: ControllerDeclarationEvidence;
  /** Canonical DTO inventory from the same source project; DTO files are not required to equal the invocation file. */
  /** Canonical DTO declarations from the same source project, not controller-file-local evidence. */
  readonly dtoDeclarationInventory: CompleteLaravelDtoDeclarationInventory;
  /** Upstream-issued proof that this declaration belongs to the invocation source. */
  readonly sourceCorrelation: LaravelControllerResponseEvidenceProductionSourceCorrelation<InvocationJudgment>;
}

/**
 * Upstream contract for collecting response evidence from existing controller
 * declaration evidence. Its output is deliberately narrower than the full
 * response evidence union: the producer cannot fabricate DTO or attribute facts.
 */
export interface LaravelControllerResponseEvidenceProductionInterface {
  readonly kind: 'laravel_controller_response_evidence_production';
  readonly closed: true;
  readonly contractVersion: 10;
  readonly contract: LaravelControllerResponseEvidenceProductionContract;
  readonly produce: <InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>(
    input: LaravelControllerResponseEvidenceProductionInput<InvocationJudgment>,
  ) => LaravelControllerResponseEvidenceProductionInventory<InvocationJudgment>;
}

/** Obligations for producing evidence without inventing response semantics. */
export interface LaravelControllerResponseEvidenceProductionContract {
  readonly kind: 'laravel_controller_response_evidence_production_contract';
  readonly contractVersion: 10;
  readonly evidenceOwner: 'ControllerDeclarationEvidence.methods.returnExpressions-responseAttribute-action-and-method-source-span';
  readonly declarationSourceCorrelationRule: 'source-correlation-is-a-closed-ADT-with-same-source-and-different-source-outcomes;producer-input-admits-only-the-same-source-receipt-issued-by-LaravelSourceIdentitySemanticsInterface;different-source-outcome-is-rejected-before-evidence-production;producer-must-not-recompute-or-infer-identity';
  readonly declarationSourceCorrelationRejectionRule: 'different-source-file-identity-is-retained-as-controller_response_evidence_declaration_source_correlation_rejected-and-cannot-be-used-as-a-production-input-or-produce-response-evidence';
  readonly presentResponseRule: 'each-method-retains-parser-observed-return-expressions-as-direct-source-evidence-and-may-also-retain-a-separate-descriptor-response-reference-candidate;descriptor-candidate-is-never-relabelled-as-parser-return-evidence';
  readonly descriptorAbsenceRule: 'response-absent-action-descriptors-produce-no-descriptor-candidate-but-do-not-erase-parser-observed-return-expressions';
  readonly outputRule: 'every-declared-method-is-retained-as-one-canonical-observation;direct-return-evidence-and-descriptor-candidates-are-flattened-without-losing-origin;zero-evidence-produces-an-explicit-empty-inventory';
  readonly noSemanticPromotion: 'response-reference-is-evidence-only-and-must-not-be-promoted-to-a-closed-response-product-by-the-producer';
  readonly methodCoverageRule: 'each-declaration-evidence-method-is-represented-exactly-once-by-one-observation-preserving-method-evidence-action-and-parser-return-evidence';
  readonly correlationRetentionRule: 'every-produced-inventory-retains-the-exact-input-declaration-source-correlation-receipt';
  readonly sourceBindingRule: 'parser-observed-return-expressions-and-descriptor-response-reference-candidates-enter-source-binding-as-distinct-evidence-kinds;neither-is-promoted-to-a-closed-response-product-without-semantic-classification';
  readonly coverageRule: 'the-complete-project-scoped-DTO-discovery-inventory-is-preserved-as-a-closed-ADT-through-production-and-source-binding;the-integrated-response-composer-consumes-existing-class-name-and-DTO-declaration-judgments;binds-class-typed-properties;and-produces-DTO-to-ResponseContract-projection-judgments;resolved-response-attribute-descriptor-remains-open';
}

/**
 * The source-binding authority returns the exact outcome allowed by the
 * evidence inventory. A present inventory may be complete or rejected; an
 * empty inventory has only the explicit empty receipt.
 */
export type LaravelControllerResponseEvidenceSourceBindingJudgmentFromInput<
  Input extends LaravelControllerResponseEvidenceSourceBindingInput = LaravelControllerResponseEvidenceSourceBindingInput,
> = Input extends Readonly<{ readonly kind: 'response_evidence_inventory_empty'; readonly invocationJudgment: infer InvocationJudgment }>
  ? InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface
    ? Extract<
        LaravelControllerResponseEvidenceSourceBindingJudgment<InvocationJudgment>,
        Readonly<{ readonly kind: 'controller_response_evidence_source_binding_empty' }>
      >
    : never
  : Input extends Readonly<{ readonly kind: 'response_evidence_inventory_present'; readonly invocationJudgment: infer InvocationJudgment }>
    ? InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface
      ? Extract<
          LaravelControllerResponseEvidenceSourceBindingJudgment<InvocationJudgment>,
          Readonly<{
            readonly kind:
              | 'controller_response_evidence_source_binding_complete'
              | 'controller_response_evidence_source_binding_rejected';
          }>
        >
      : never
    : never;

/**
 * Existing source identity semantics owns each identity comparison. This
 * interface only correlates evidence into a closed receipt; it is not a second
 * identity authority and does not classify response products.
 */
export interface LaravelControllerResponseEvidenceSourceBindingAuthorityInterface {
  readonly kind: 'laravel_controller_response_evidence_source_binding_authority';
  readonly closed: true;
  readonly contract: LaravelControllerResponseEvidenceSourceBindingContract;
  readonly sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface;
  readonly bind: <Input extends LaravelControllerResponseEvidenceSourceBindingInput>(
    input: Input,
  ) => LaravelControllerResponseEvidenceSourceBindingJudgmentFromInput<Input>;
}

/**
 * Type-level obligation for source binding: the receipt must be produced by the
 * existing source-identity semantics contract, and each evidence item must have
 * its own identity judgment against the invocation's exact source subject.
 */
export interface LaravelControllerResponseEvidenceSourceBindingContract {
  readonly kind: 'laravel_controller_response_evidence_source_binding_contract';
  readonly contractVersion: 9;
  readonly owner: 'LaravelSourceIdentitySemanticsInterface';
  readonly cardinality: 'one-source-identity-judgment-per-response-evidence-item';
  readonly coverage: 'every-response-evidence-item-is-represented-exactly-once-with-no-omissions-or-duplicates';
  readonly completeMeaning: 'non-empty-evidence-set-and-every-item-is-bound-to-the-exact-invocation-source-subject';
  readonly emptyMeaning: 'zero-evidence-is-an-explicit-empty-receipt-and-never-a-complete-binding';
  readonly rejectedMeaning: 'at-least-one-evidence-item-has-a-different-source-file-identity-and-all-other-items-remain-represented';
  readonly emptyOutcome: 'zero-evidence-is-represented-by-controller_response_evidence_source_binding_empty-not-by-an-empty-complete-or-rejected-tuple';
  readonly noInference: 'response-authority-must-not-infer-source-identity-from-path-text-or-controller-name';
  readonly producerBoundary: 'controller-owned-response-evidence-is-bound-by-existing-source-identity-semantics;same-project-DTO-inventory-is-carried-as-separate-context-and-is-not-compared-to-the-invocation-file-as-if-it-were-controller-local-evidence';
  readonly inventoryOutcome: 'empty-inventory-produces-only-empty-receipt;non-empty-inventory-produces-complete-or-rejected-receipt';
  readonly observationOwnership: 'every-bound-evidence-item-retains-the-exact-controller-method-observation-that-produced-it-and-the-receipt-retains-all-method-observations-including-methods-with-zero-evidence';
  readonly observationCoverage: 'binding-iterates-canonical-observations-and-their-evidence;flattened-inventory-is-not-the-source-of-method-association;all-canonical-method-observations-remain-on-the-receipt';
}

/** Source-correlated input to the response judgment authority. */
export interface LaravelControllerResponseSemanticJudgmentInput<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> {
  readonly kind: 'laravel_controller_response_semantic_judgment_input';
  readonly invocationJudgment: InvocationJudgment;
  readonly sourceBindingJudgment: LaravelControllerResponseEvidenceSourceBindingJudgment<InvocationJudgment>;
  /** Existing PHP class-name and DTO declaration authorities' judgments, kept separate from same-file source binding. */
  readonly dtoDeclarationResolutionJudgments: readonly LaravelControllerResponseDtoDeclarationResolutionJudgment[];
  /** Every class-typed property on each resolved response DTO is bound through the existing class-name and declaration authorities. */
  readonly dtoPropertyTypeReferenceBindingEvidence: readonly LaravelDtoPropertyTypeReferenceBindingEvidence[];
  /** Every resolved response DTO is projected through the existing DTO-to-ResponseContract interface. */
  readonly dtoResponseContractProjectionJudgments: readonly LaravelDtoResponseContractProjectionJudgment[];
}

/** Explicit rejected result carried by the controller artifact ADT. */
export type LaravelControllerResponseEvidenceSourceBindingRejectedJudgment<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> = Readonly<{
  readonly kind: 'controller_response_evidence_source_binding_rejected';
  readonly invocationJudgment: InvocationJudgment;
  readonly sourceBindingJudgment: Extract<
    LaravelControllerResponseEvidenceSourceBindingJudgment<InvocationJudgment>,
    { readonly kind: 'controller_response_evidence_source_binding_rejected' }
  >;
}>;

/**
 * Result type indexed by the exact input receipt. A rejected evidence binding
 * can never type-check as a complete response product, regardless of invocation
 * outcome. The rejection retains both the original invocation judgment and the
 * source-binding receipt that proves why completion is forbidden.
 */
type LaravelControllerResponseSemanticJudgmentForBinding<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface,
  BindingJudgment extends Readonly<{
    readonly kind: 'controller_response_evidence_source_binding_complete' | 'controller_response_evidence_source_binding_rejected' | 'controller_response_evidence_source_binding_empty';
  }>,
> = BindingJudgment extends Readonly<{ readonly kind: 'controller_response_evidence_source_binding_rejected' }>
  ? LaravelControllerResponseEvidenceSourceBindingRejectedJudgment<InvocationJudgment>
  : BindingJudgment extends Readonly<{ readonly kind: 'controller_response_evidence_source_binding_empty' }>
    ? Extract<
        LaravelControllerResponseSemanticJudgmentFor<InvocationJudgment>,
        Readonly<{
          readonly kind:
            | 'controller_response_invocation_not_connected'
            | 'controller_response_source_binding_rejected'
            | 'controller_response_blocked';
        }>
      >
    : BindingJudgment extends Readonly<{ readonly kind: 'controller_response_evidence_source_binding_complete' }>
      ? LaravelControllerResponseSemanticJudgmentFor<InvocationJudgment>
      : never;

export type LaravelControllerResponseSemanticJudgmentFromInput<
  Input extends LaravelControllerResponseSemanticJudgmentInput = LaravelControllerResponseSemanticJudgmentInput,
> = Input extends LaravelControllerResponseSemanticJudgmentInput
  ? LaravelControllerResponseSemanticJudgmentForBinding<Input['invocationJudgment'], Input['sourceBindingJudgment']>
  : never;

/**
 * The only contract that closes Laravel HTTP-response meaning. This is distinct
 * from the existing PHP invocation integration authority and does not duplicate it.
 */
export interface LaravelControllerResponseSemanticJudgmentAuthorityInterface {
  readonly kind: 'laravel_controller_response_semantic_judgment_authority';
  readonly closed: true;
  readonly contract: LaravelControllerResponseSemanticJudgmentContract;
  readonly sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface;
  readonly sourceBindingContract: LaravelControllerResponseEvidenceSourceBindingContract;
  readonly returnResponseProjection: LaravelControllerReturnResponseProjectionInterface;
  readonly judge: <Input extends LaravelControllerResponseSemanticJudgmentInput>(
    input: Input,
  ) => LaravelControllerResponseSemanticJudgmentFromInput<Input>;
}

/**
 * Runtime executor contract for the response stage. Its implementation delegates
 * to the declared authority and returns the authority-owned ADT unchanged; it does
 * not inspect descriptors, classify response kinds, or reconstruct provenance.
 */
export interface LaravelControllerResponseSemanticRuntimeExecutorInterface<
  Authority extends LaravelControllerResponseSemanticJudgmentAuthorityInterface = LaravelControllerResponseSemanticJudgmentAuthorityInterface,
> {
  readonly kind: 'laravel_controller_response_semantic_runtime_executor';
  readonly closed: true;
  readonly contractVersion: 2;
  /** The executor is indexed by the existing authority contract; it does not define a second response authority. */
  readonly authority: Authority;
  /**
   * Projection dependency is selected from the same authority type instead of
   * being independently reclassified as an unrelated projection contract.
   * This is a type-level dependency, not proof of runtime object identity.
   */
  readonly returnResponseProjection: Authority['returnResponseProjection'];
  /**
   * Execution is the selected authority's own input-indexed judgment signature.
   * The executor cannot independently widen or redefine the authority's result contract.
   */
  readonly execute: Authority['judge'];
}

/**
 * Input to the pipeline's declaration-source correlation projection. The source
 * identity relation is already judged by LaravelSourceIdentitySemanticsInterface;
 * this boundary only binds that receipt to the exact invocation/declaration pair.
 */
export interface LaravelControllerResponseDeclarationSourceCorrelationInput<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> {
  readonly kind: 'laravel_controller_response_declaration_source_correlation_input';
  readonly invocationJudgment: InvocationJudgment;
  readonly declarationEvidence: ControllerDeclarationEvidence;
}

/**
 * Dependency contract for the existing response authorities consumed by the
 * controller scanner. This is composition of existing owners, not a new semantic
 * authority or subscanner: source identity, evidence production, evidence binding,
 * and response judgment keep their existing ownership boundaries.
 */
export interface LaravelControllerResponseIntegratedJudgmentInput<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> {
  readonly kind: 'laravel_controller_response_integrated_judgment_input';
  readonly invocationJudgment: InvocationJudgment;
  readonly declarationEvidence: ControllerDeclarationEvidence;
  /** The scanner's canonical project subject is independent of the inventory's claimed project identity. */
  readonly sourceProject: CompleteLaravelDtoDeclarationInventory['sourceProject'];
  /** Closed DTO discovery receipt; discovery completeness is explicit and distinct from class-name resolution completeness. */
  readonly dtoDeclarationInventory: Extract<
    LaravelProjectDtoDeclarationInventoryInterface,
    { readonly kind: 'laravel_project_dto_declaration_inventory_complete' }
  >;
}

/** Closed result of composing response evidence with one exact invocation judgment. */
export type LaravelControllerIntegratedResponseJudgment<
  InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> =
  | LaravelControllerResponseSemanticJudgmentFor<InvocationJudgment>
  | LaravelControllerResponseEvidenceSourceBindingRejectedJudgment<InvocationJudgment>
  | LaravelControllerResponseEvidenceProductionSourceCorrelationRejectedJudgment<InvocationJudgment>;

export interface LaravelControllerResponseSemanticPipelineInterface {
  readonly kind: 'laravel_controller_response_semantic_pipeline';
  readonly closed: true;
  readonly contractVersion: 31;
  readonly dependencies: LaravelControllerResponseSemanticPipelineDependenciesInterface;
  readonly sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface;
  /** Obtains identity judgment for the exact invocation/declaration source operands through the existing identity owner. */
  readonly correlateDeclarationSource: <InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>(
    input: LaravelControllerResponseDeclarationSourceCorrelationInput<InvocationJudgment>,
  ) => LaravelControllerResponseEvidenceProductionSourceCorrelationJudgment<InvocationJudgment>;
  /** Composes source correlation, evidence production, per-evidence source binding, and response judgment for the exact invocation judgment. */
  readonly judgeIntegratedResponse: <InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>(
    input: LaravelControllerResponseIntegratedJudgmentInput<InvocationJudgment>,
  ) => LaravelControllerIntegratedResponseJudgment<InvocationJudgment>;
  readonly evidenceProduction: LaravelControllerResponseEvidenceProductionInterface;
  readonly evidenceSourceBinding: LaravelControllerResponseEvidenceSourceBindingAuthorityInterface;
  readonly dtoTypeReferenceBindingAuthority: LaravelDtoTypeReferenceBindingAuthorityInterface;
  readonly dtoResponseContractProjection: import('./laravelDtoResponseContractProjectionInterface').LaravelDtoResponseContractProjectionAuthorityInterface;
  readonly responseExecutor: LaravelControllerResponseSemanticRuntimeExecutorInterface;
  /** Projects only already-closed per-method ResponseResult products into canonical ResponseDefinition/ResponseAst values. */
  readonly responseOutputTypeJudgment: LaravelControllerResponseOutputTypeJudgmentInterface;
  readonly methodResponseAstProjection: LaravelControllerMethodResponseAstProjectionInterface;
  /** Existing AST projection authority receives the closed invocation/response judgment pair; it does not reconstruct either judgment. */
  readonly astProjection: LaravelControllerAstProjectionSemanticAuthorityInterface;
  readonly contract: LaravelControllerResponseSemanticPipelineContract;
}

/** Obligations for connecting existing response contracts without reclassification. */
export interface LaravelControllerResponseSemanticPipelineContract {
  readonly kind: 'laravel_controller_response_semantic_pipeline_contract';
  readonly contractVersion: 31;
  readonly identityOwner: 'LaravelSourceIdentitySemanticsInterface';
  readonly evidenceOwner: 'LaravelControllerResponseEvidenceProductionInterface';
  readonly evidenceProductionDependencyRule: 'integrated-response-uses-the-exact-evidence-producer-carried-by-the-complete-dependency-contract';
  readonly methodProjectionDependencyRule: 'method-response-AST-projection-and-output-type-judgment-are-one-composed-authority-contract';
  readonly bindingOwner: 'LaravelControllerResponseEvidenceSourceBindingAuthorityInterface';
  readonly dtoTypeReferenceBindingOwner: 'LaravelDtoTypeReferenceBindingAuthorityInterface';
  readonly dtoResolutionDependencyClosureRule: 'controller-response-and-DTO-property-resolution-consume-the-class-name-and-declaration-authorities-owned-by-the-same-DTO-type-reference-binding-dependency-contract';
  readonly dtoResponseContractProjectionOwner: 'LaravelDtoResponseContractProjectionAuthorityInterface';
  readonly dtoProjectionBindingScopeRule: 'each-DTO-response-contract-projection-receives-only-property-reference-bindings-owned-by-that-exact-resolved-DTO-declaration;cross-DTO-bindings-are-excluded-before-the-projection-interface-is-called';
  readonly methodResponseProductProvenanceRule: 'each-method-response-product-carries-only-DTO-response-contract-projections-owned-by-the-exact-canonical-method-evidence;the-AST-projection-forwards-that-complete-product-without-reconstructing-association';
  readonly responseMeaningOwner: 'LaravelControllerResponseSemanticJudgmentAuthorityInterface';
  readonly responseAuthorityDependencyRule: 'pipeline-uses-the-authority-carried-by-its-complete-dependency-contract;identity-correlation-and-source-binding-use-that-authority-same-identity-owner';
  readonly responseExecutorDependencyRule: 'runtime-executor-is-constructed-from-the-exact-response-semantic-authority-in-the-complete-pipeline-dependency-contract';
  readonly executionOwner: 'LaravelControllerResponseSemanticRuntimeExecutorInterface';
  readonly responseOutputTypeOwner: 'LaravelControllerResponseOutputTypeJudgmentInterface';
  readonly paginationEnvelopeOwner: 'LaravelControllerResponseOutputTypeJudgmentInterface.paginationEnvelope';
  readonly paginationEnvelopeRule: 'framework-owned-pagination-envelope-is-a-typed-ADT-projection-and-custom-resource-pagination-information-remains-unresolved';
  readonly paginationMetadataProfileOwner: 'LaravelControllerResponsePaginationEnvelopeJudgmentInterface.metadataProfile';
  readonly frameworkVersionEvidenceOwner: 'composer.lock laravel/framework package entry';
  readonly frameworkVersionCompatibilityRule: 'scanner-acquires-composer-lock-facts-only;the-existing-pagination-metadata-profile-interface-judges-version-compatibility-and-only-verified-Laravel-12.x-is-admitted';
  readonly paginationMetadataProvenanceRule: 'framework-default-metadata-fields-are-typed-from-canonical-pagination-kind-and-retain-method-source-provenance-not-inferred-runtime-values';
  readonly resourceOutputShapeRule: 'resource-output-type-is-derived-only-from-unique-resolved-ResourceDefinition-fields-and-is-unresolved-when-dynamic-or-custom-response-shape-is-present';
  readonly methodResponseAstProjectionOwner: 'LaravelControllerMethodResponseAstProjectionInterface';
  readonly resourceOutputShapeOwner: 'resolved-LaravelResourceScanJudgment-definitions';
  readonly astProjectionOwner: 'LaravelControllerAstProjectionSemanticAuthorityInterface';
  readonly sourceCorrelationOrder: 'exact-invocation-source-and-declaration-source-to-existing-source-identity-authority-to-closed-correlation-ADT-before-evidence-production';
  readonly sourceCorrelationProjectionOwner: 'LaravelControllerResponseSemanticPipelineInterface.correlateDeclarationSource-asks-LaravelSourceIdentitySemanticsInterface-to-judge-the-exact-invocation-and-declaration-source-operands-and-wraps-that-result-without-reimplementing-identity';
  readonly integratedJudgmentOwner: 'LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse';
  readonly integratedJudgmentRule: 'one-interface-method-composes-source-correlation-evidence-production-source-binding-and-response-judgment-without-reconstructing-the-invocation-judgment';
  readonly dtoDiscoveryBoundary: 'integrated-response-input-requires-a-complete-project-scoped-discovery-receipt;class-typed-properties-are-bound-and-response-DTOs-are-projected-through-existing-upstream-interfaces;legacy-evidence-projection-is-derived-only-inside-the-existing-pipeline';
  readonly dtoPropertyReferenceBindingRule: 'each-class-reference-property-on-each-resolved-response-DTO-is-bound-through-the-existing-php-class-name-and-DTO-declaration-authorities;unresolved-property-binding-blocks-response-completion-and-is-retained-as-project-context-evidence';
  readonly sourceCorrelationInputIntegrity: 'caller-cannot-supply-an-independent-identity-judgment;correlation-pipeline-derives-the-judgment-from-the-exact-sources-carried-by-invocationJudgment-and-declarationEvidence';
  readonly responseOrder: 'produced-evidence-and-all-method-observations-to-per-item-source-binding-judgment-to-existing-ControllerReturnSemantic-ADT-product-to-typed-ResponseResult-projection-to-response-executor-to-method-ResponseDefinition-and-ResponseAst-projection-to-controller-AST-projection';
  readonly responseAstProjectionRule: 'production-response-scanner-consumes-only-closed-method-response-products-from-controller-scan-and-does-not-rescan-or-reclassify-controller-return-syntax';
  readonly methodEvidenceOwnership: 'source-binding-entry-retains-the-exact-canonical-method-observation-and-action-that-own-the-evidence';
  readonly astProjectionOrder: 'the-existing-AST-projection-authority-consumes-the-exact-invocation-and-response-judgments-after-response-execution-and-forwards-the-pair-without-reclassification-or-reconstruction';
  readonly rejectedCorrelationRule: 'different-source-identity-cannot-enter-evidence-production-and-must-remain-an-explicit-rejected-ADT-outcome';
  readonly rejectedCorrelationArtifactRule: 'controller_response_declaration_source_correlation_rejected-retains-the-exact-invocation-judgment-and-rejected-source-correlation-receipt-and-is-a-first-class-response-judgment-ADT-member-for-AST-projection';
  readonly rejectedBindingRule: 'rejected-source-binding-cannot-be-converted-to-a-complete-response-judgment';
  readonly noReclassificationRule: 'scanner-and-runtime-executor-forward-existing-judgments-and-never-reclassify-descriptors-or-reconstruct-provenance';
  readonly noReplacementLayerRule: 'compose-existing-contracts-without-adding-relation-or-foundation-operations-or-a-parallel-semantic-authority';
  readonly projectionBoundaryRule: 'AST-projection-authority-is-composed-as-an-existing-dependency;the-response-pipeline-does-not-own-or-reimplement-AST-projection-semantics';
  readonly responseArtifactOutcomeRule: 'scanner-artifact-retains-either-a-closed-response-semantic-judgment-or-an-explicit-source-binding-or-declaration-correlation-rejection-judgment;rejection-is-never-erased-into-an-empty-success';
  readonly invocationOutcomeUniformityRule: 'every-closed-invocation-judgment-outcome-enters-the-same-response-evidence-and-AST-projection-sequence;response-authority-and-projection-ADT-preserve-outcome-differences;scanner-does-not-branch-or-reconstruct-by-invocation-response-kind';
}

/** Contract facts for the response authority and its non-reasoning executor. */
export interface LaravelControllerResponseSemanticJudgmentContract {
  readonly kind: 'laravel_controller_response_semantic_judgment_contract';
  readonly contractVersion: 13;
  readonly evidenceRule: 'descriptor-derived-response-reference-is-a-candidate-not-direct-PHP-return-proof;attribute-return-and-DTO-observations-remain-source-evidence-until-a-closed-response-product-is-published;integrated-response-composition-retains-PHP-class-name-and-DTO-declaration-judgments-as-project-context-and-retains-property-reference-binding-and-DTO-ResponseContract-projection-judgments-separately-from-controller-local-evidence';
  readonly invocationCorrelation: 'response-judgment-is-indexed-by-the-controller-artifact-invocation-outcome-and-retains-that-exact-invocation-subtype-without-reconstruction-or-widening';
  readonly sourceBinding: 'every-response-evidence-item-carries-an-explicit-source-identity-judgment-against-the-exact-invocation-source-subject';
  readonly descriptorCandidateBoundary: 'source-identity-binding-proves-source-file-identity-only;it-does-not-upgrade-a-controller-action-descriptor-response-reference-candidate-into-direct-PHP-return-evidence';
  readonly outputRule: 'fully-projectable-canonical-method-returns-produce-controller_response_method_products_complete;otherwise-canonical-return-closure-remains-controller_response_return_semantics_complete;legacy-products-remain-only-when-proven;blocked-evidence-is-never-coerced-to-empty-success';
  readonly canonicalReturnOwnership: 'method-response-product-reads-action.semantic.returned-from-the-existing-ControllerReturnSemantic-ADT-without-reclassifying-PHP-syntax';
  readonly sourceBindingOutcomeRule: 'a-rejected-response-evidence-source-binding-produces-controller_response_evidence_source_binding_rejected-with-the-original-invocation-and-receipt;an-empty-receipt-can-only-preserve-not-connected-rejected-or-blocked-outcomes;neither-can-produce-controller_response_complete';
  readonly evidenceCoverageRule: 'every-response-evidence-item-is-correlated-exactly-once;complete-binding-is-non-empty;zero-evidence-has-an-explicit-empty-outcome-that-cannot-produce-controller_response_complete';
  readonly compositionRule: 'integrated-response-composition-consumes-closed-PHP-class-name-and-DTO-declaration-judgments;binds-class-typed-properties-on-each-resolved-response-DTO;then-projects-each-resolved-response-DTO-through-the-existing-LaravelDtoResponseContractProjectionInterface;unresolved-field-projection-blocks-response-completion';
  readonly methodProductOwnershipRule: 'each-controller-method-response-product-carries-only-DTO-response-contract-projection-judgments-owned-by-that-exact-canonical-method-evidence;non-controller DTO property owners never enter method products;AST projection forwards the enriched product without rebuilding the association';
  readonly descriptorEvidenceRule: 'controller-action-response-reference-candidate-retains-descriptor-origin-and-must-not-be-relabelled-as-a-parser-observed-PHP-return';
  readonly astProjectionRule: 'controller-artifact-carries-the-response-judgment-as-a-closed-ADT-and-source-AST-projection-forwards-the-artifact-without-reconstructing-response-meaning';
  readonly runtimeRule: 'runtime-executor-only-delegates-to-the-response-authority-and-forwards-its-closed-judgment-without-reasoning-or-reconstruction';
  readonly authorityOwnership: 'this-authority-closes-Laravel-HTTP-response-meaning-and-does-not-replace-or-duplicate-the-PHP-invocation-semantic-authority';
  readonly executorOwnership: 'executor-delegates-to-the-declared-response-authority-and-preserves-the-exact-outcome-indexed-ADT';
  readonly sourceIdentityOwnership: 'existing-Laravel-source-identity-semantics-owns-each-evidence-to-invocation-source-identity-judgment';
}
