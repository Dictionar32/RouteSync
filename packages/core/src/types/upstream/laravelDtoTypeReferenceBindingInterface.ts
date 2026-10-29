import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { DtoProperty } from './application';
import type { LaravelDtoDeclarationResolvedSourceEvidence } from './laravelControllerResponseDtoDeclarationInterface';
import type { ClassName } from './names';
import type { SourceSpan } from './provenance';
import type { PhpClassNameResolutionRuleInterface } from './phpClassNameResolutionInterface';
import type {
  PhpClassNameResolution,
  PhpClassNameResolutionContext,
} from './phpClassNameResolutionInterface';
import type {
  LaravelControllerResponseDtoDeclarationResolutionJudgment,
  LaravelProjectDtoDeclarationInventoryInterface,
} from './laravelControllerResponseDtoDeclarationInterface';

export type LaravelDtoTypeReferenceLexicalContext =
  | PhpClassNameResolutionContext
  | Readonly<{ readonly kind: 'php_class_name_resolution_context_unavailable' }>;

/** A class type reference as written in a DTO property, before canonical binding. */
export interface LaravelDtoTypeReferenceBindingInput<Project extends SourceProjectIdentity = SourceProjectIdentity> {
  readonly kind: 'laravel_dto_type_reference_binding_input';
  readonly sourceProject: Project;
  readonly sourceName: ClassName;
  readonly lexicalContext: LaravelDtoTypeReferenceLexicalContext;
  readonly inventory: LaravelProjectDtoDeclarationInventoryInterface<Project>;
  readonly source: SourceSpan;
}

/**
 * A reference is bound only when PHP lexical resolution and the existing DTO
 * declaration authority both close successfully. This is evidence, not a
 * ResponseContract: projection remains a separate semantic obligation.
 */
export type LaravelDtoTypeReferenceBindingJudgment<Project extends SourceProjectIdentity = SourceProjectIdentity> =
  | Readonly<{
      readonly kind: 'laravel_dto_type_reference_bound';
      readonly input: LaravelDtoTypeReferenceBindingInput<Project>;
      readonly classNameResolution: Extract<PhpClassNameResolution, { readonly kind: 'php_class_name_resolved' }>;
      readonly declarationJudgment: Extract<LaravelControllerResponseDtoDeclarationResolutionJudgment<Project>, { readonly kind: 'response_dto_declaration_resolved' }>;
    }>
  | Readonly<{
      readonly kind: 'laravel_dto_type_reference_unresolved';
      readonly input: LaravelDtoTypeReferenceBindingInput<Project>;
      readonly classNameResolution: PhpClassNameResolution;
      readonly declarationJudgment: LaravelControllerResponseDtoDeclarationResolutionJudgment<Project> | Readonly<{ readonly kind: 'not_attempted'; readonly reason: 'class_name_resolution_blocked' }>;
      readonly reason:
        | 'class_name_resolution_blocked'
        | 'declaration_unresolved'
        | 'declaration_ambiguous';
    }>;

export interface LaravelDtoTypeReferenceBindingContract {
  readonly kind: 'laravel_dto_type_reference_binding_contract';
  readonly version: 2;
  readonly lexicalResolutionOwner: 'PhpClassNameResolutionRuleInterface';
  readonly declarationResolutionOwner: 'LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface';
  readonly positiveBindingRule: 'both-lexical-class-name-resolution-and-exactly-one-canonical-project-declaration-must-resolve';
  readonly projectRule: 'source-project-and-inventory-project-must-match-under-the-existing-source-identity-semantics';
  readonly ambiguityRule: 'multiple-canonical-declarations-remain-an-ambiguous-judgment';
  readonly noShortNameFallback: 'unqualified-short-name-is-never-promoted-to-a-canonical-type-identity-without-lexical-resolution';
  readonly noPromotion: 'a-bound-type-reference-is-not-by-itself-a-response-value-contract-or-response-contract';
  readonly provenanceRule: 'the-property-type-source-span-is-retained-on-every-judgment';
  readonly runtimeRule: 'runtime-executor-delegates-to-this-binding-authority-without-reclassification';
}

export interface LaravelDtoTypeReferenceBindingAuthorityDependenciesInterface<Project extends SourceProjectIdentity = SourceProjectIdentity> {
  readonly classNameResolutionAuthority: PhpClassNameResolutionRuleInterface;
  readonly declarationResolutionAuthority: import('./laravelControllerResponseDtoDeclarationInterface').LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface<Project>;
}

export interface LaravelDtoTypeReferenceBindingAuthorityFactoryInterface {
  readonly kind: 'laravel_dto_type_reference_binding_authority_factory';
  readonly create: <Project extends SourceProjectIdentity = SourceProjectIdentity>(
    dependencies: LaravelDtoTypeReferenceBindingAuthorityDependenciesInterface<Project>,
  ) => LaravelDtoTypeReferenceBindingAuthorityInterface<Project>;
}

export interface LaravelDtoTypeReferenceBindingAuthorityInterface<Project extends SourceProjectIdentity = SourceProjectIdentity> {
  readonly kind: 'laravel_dto_type_reference_binding_authority';
  readonly contract: LaravelDtoTypeReferenceBindingContract;
  readonly dependencies: LaravelDtoTypeReferenceBindingAuthorityDependenciesInterface<Project>;
  readonly bind: (input: LaravelDtoTypeReferenceBindingInput<Project>) => LaravelDtoTypeReferenceBindingJudgment<Project>;
}

export interface LaravelDtoTypeReferenceBindingRuntimeExecutorInterface<
  Project extends SourceProjectIdentity = SourceProjectIdentity,
  Authority extends LaravelDtoTypeReferenceBindingAuthorityInterface<Project> = LaravelDtoTypeReferenceBindingAuthorityInterface<Project>,
> {
  readonly kind: 'laravel_dto_type_reference_binding_runtime_executor';
  readonly closed: true;
  readonly contractVersion: 2;
  readonly authority: Authority;
  readonly contract: Authority['contract'];
  readonly execute: Authority['bind'];
  readonly executionRule: 'delegate-to-the-bound-authority-and-return-its-exact-judgment';
}


/** A property-level binding keeps the exact owning DTO and property evidence. */
export type LaravelDtoPropertyTypeReferenceBindingEvidence = Readonly<{
  readonly kind: 'laravel_dto_property_type_reference_binding_evidence';
  readonly ownerDeclaration: LaravelDtoDeclarationResolvedSourceEvidence;
  readonly property: DtoProperty;
  readonly judgment: LaravelDtoTypeReferenceBindingJudgment;
}>;

/** The integrated response carries a closed inventory of every class-typed DTO property it evaluated. */
export interface LaravelDtoPropertyTypeReferenceBindingEvidenceContract {
  readonly kind: 'laravel_dto_property_type_reference_binding_evidence_contract';
  readonly version: 1;
  readonly coverageRule: 'every-class-reference-property-on-each-resolved-response-dto-is-retained-exactly-once';
  readonly ownershipRule: 'each-property-binding-retains-the-resolved-owning-dto-declaration-and-canonical-property';
  readonly failureRule: 'an-unresolved-property-reference-blocks-integrated-response-completion';
  readonly noPromotionRule: 'property-reference-binding-does-not-itself-produce-a-response-value-or-response-contract';
}

export const LARAVEL_DTO_PROPERTY_TYPE_REFERENCE_BINDING_EVIDENCE_CONTRACT: LaravelDtoPropertyTypeReferenceBindingEvidenceContract = Object.freeze({
  kind: 'laravel_dto_property_type_reference_binding_evidence_contract',
  version: 1,
  coverageRule: 'every-class-reference-property-on-each-resolved-response-dto-is-retained-exactly-once',
  ownershipRule: 'each-property-binding-retains-the-resolved-owning-dto-declaration-and-canonical-property',
  failureRule: 'an-unresolved-property-reference-blocks-integrated-response-completion',
  noPromotionRule: 'property-reference-binding-does-not-itself-produce-a-response-value-or-response-contract',
});
