import type { ResponseContract, ResponseContractField } from '../domain/responseContracts';
import type { ResponseShape } from '../domain/responseShapes';
import type {
  LaravelControllerResponseDtoDeclarationResolutionJudgment,
} from './laravelControllerResponseDtoDeclarationInterface';
import type { SourceSpan } from './provenance';
import type { LaravelDtoPropertyTypeReferenceBindingEvidence } from './laravelDtoTypeReferenceBindingInterface';


/** Response shape must come from the original controller attribute evidence, never from DTO-name inference. */
export type LaravelDtoResponseShapeEvidence =
  | Readonly<{ readonly kind: 'laravel_dto_response_shape_available'; readonly shape: ResponseShape }>
  | Readonly<{ readonly kind: 'laravel_dto_response_shape_unavailable'; readonly reason: 'controller_response_shape_evidence_missing' }>;

/**
 * A projection request is admitted only after canonical DTO declaration
 * resolution. A short class token, raw DTO AST, or unresolved declaration is
 * not sufficient authority to create a response contract.
 */
export type LaravelDtoResponseContractProjectionInput = Readonly<{
  readonly kind: 'laravel_dto_response_contract_projection_input';
  readonly declarationJudgment: Extract<
    LaravelControllerResponseDtoDeclarationResolutionJudgment,
    { readonly kind: 'response_dto_declaration_resolved' }
  >;
  readonly responseShapeEvidence: LaravelDtoResponseShapeEvidence;
  readonly propertyTypeReferenceBindings: readonly LaravelDtoPropertyTypeReferenceBindingEvidence[];
}>;

/**
 * Provenance-bearing projection of one canonical response field.
 *
 * The field itself reuses ResponseContractField as the domain SSOT; this
 * interface must not independently restate name/value/nullability and thereby
 * permit two contradictory descriptions of the same projected field.
 */
export interface LaravelDtoResponseContractFieldProjection {
  readonly kind: 'laravel_dto_response_contract_field_projection';
  readonly field: ResponseContractField;
  readonly source: SourceSpan;
}

/**
 * Closed outcomes for DTO-to-response-contract projection. The unresolved
 * branch prevents unsupported PHP type expressions from being guessed as JSON.
 */
export type LaravelDtoResponseContractProjectionJudgment =
  | Readonly<{
      readonly kind: 'laravel_dto_response_contract_projection_resolved';
      readonly input: LaravelDtoResponseContractProjectionInput;
      readonly responseContract: ResponseContract;
      readonly fieldProjections: readonly LaravelDtoResponseContractFieldProjection[];
      readonly declarationSource: SourceSpan;
    }>
  | Readonly<{
      readonly kind: 'laravel_dto_response_contract_projection_unresolved';
      readonly input: LaravelDtoResponseContractProjectionInput;
      readonly reason:
        | 'dto-field-type-not-representable-in-response-contract'
        | 'dto-field-name-not-canonical'
        | 'dto-field-nullability-not-closed'
        | 'response-type-identity-not-canonical'
        | 'dto-field-presence-semantics-not-closed'
        | 'response-shape-evidence-unavailable';
      readonly source: SourceSpan;
    }>;

export interface LaravelDtoResponseContractProjectionContract {
  readonly kind: 'laravel_dto_response_contract_projection_contract';
  readonly contractVersion: 3;
  readonly inputRule: 'only-a-resolved-project-correlated-dto-declaration-judgment-may-enter-projection';
  readonly identityRule: 'response-type-identity-is-derived-from-the-canonical-qualified-class-identity-in-the-declaration-judgment';
  readonly fieldRule: 'every-public-dto-property-produces-one-ResponseContractField-with-source-provenance;the-domain-field-shape-is-reused-without-redeclaring-name-value-or-nullability';
  readonly typeRule: 'only-type-expressions-with-an-explicit-response-value-contract-mapping-are-admitted';
  readonly closureRule: 'one-unresolved-public-field-blocks-the-whole-response-contract-instead-of-being-dropped-or-guessed';
  readonly shapeRule: 'response-shape-is-forwarded-from-the-controller-response-attribute-evidence-without-reclassification';
  readonly provenanceRule: 'the-result-retains-the-exact-resolved-declaration-and-per-field-source-provenance;each-projection-field-is-the-same-domain-field-shape-used-by-ResponseContract';
  readonly noPromotionRule: 'dto-declaration-resolution-alone-does-not-prove-a-response-contract;this-projection-judgment-must-succeed';
  readonly integrationOwner: 'LaravelControllerResponseSemanticPipelineInterface';
  readonly runtimeRule: 'runtime-executor-only-forwards-the-closed-projection-judgment-and-does-not-infer-field-semantics';
}

/** Interface-first owner for the DTO AST to canonical ResponseContract boundary. */
export interface LaravelDtoResponseContractProjectionInterface {
  readonly kind: 'laravel_dto_response_contract_projection';
  readonly contract: LaravelDtoResponseContractProjectionContract;
  readonly project: (
    input: LaravelDtoResponseContractProjectionInput,
  ) => LaravelDtoResponseContractProjectionJudgment;
}

/** Authority role is explicit so consumers depend on the judgment owner, not its implementation module. */
export interface LaravelDtoResponseContractProjectionAuthorityInterface extends LaravelDtoResponseContractProjectionInterface {
  readonly authorityRole: 'semantic_judgment_owner';
}

/** Runtime execution is deliberately separate from semantic projection ownership. */
export interface LaravelDtoResponseContractProjectionRuntimeExecutorInterface<
  Projection extends LaravelDtoResponseContractProjectionAuthorityInterface = LaravelDtoResponseContractProjectionAuthorityInterface,
> {
  readonly kind: 'laravel_dto_response_contract_projection_runtime_executor';
  readonly closed: true;
  readonly contractVersion: 3;
  readonly projection: Projection;
  readonly contract: Projection['contract'];
  readonly execute: Projection['project'];
  readonly executionRule: 'delegate-to-the-bound-projection-interface-and-return-its-exact-judgment';
}
