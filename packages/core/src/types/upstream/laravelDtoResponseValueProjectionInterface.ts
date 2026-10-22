import type { ResponseValueContract } from '../domain/responseContracts';
import type { TypeExpression } from './typeVocabulary';
import type { SourceSpan } from './provenance';
import type { LaravelDtoTypeReferenceBindingJudgment } from './laravelDtoTypeReferenceBindingInterface';

/** Evidence for one already-parsed PHP type expression on a DTO property. */
export type LaravelDtoResponseValueProjectionInput = Readonly<{
  readonly kind: 'laravel_dto_response_value_projection_input';
  readonly expression: TypeExpression;
  readonly source: SourceSpan;
  readonly referenceBinding: LaravelDtoResponseValueReferenceBindingEvidence;
}>;


/** Class references require an explicit binding judgment; non-reference roots say so explicitly. */
export type LaravelDtoResponseValueReferenceBindingEvidence =
  | Readonly<{ readonly kind: 'response_value_reference_binding_not_required' }>
  | Readonly<{
      readonly kind: 'response_value_reference_binding_required';
      readonly judgment: LaravelDtoTypeReferenceBindingJudgment;
    }>;

/**
 * A closed semantic result for mapping PHP TypeExpression into the response
 * domain. The authority implements this contract; the executor only delegates.
 */
export type LaravelDtoResponseValueProjectionJudgment =
  | Readonly<{
      readonly kind: 'laravel_dto_response_value_projection_resolved';
      readonly input: LaravelDtoResponseValueProjectionInput;
      readonly value: ResponseValueContract;
    }>
  | Readonly<{
      readonly kind: 'laravel_dto_response_value_projection_unresolved';
      readonly input: LaravelDtoResponseValueProjectionInput;
      readonly reason:
        | 'primitive-vocabulary-does-not-preserve-response-meaning'
        | 'class-reference-requires-canonical-declaration-binding'
        | 'array-map-requires-explicit-key-value-response-representation'
        | 'intersection-has-no-faithful-response-value-representation'
        | 'callable-has-no-response-value-representation'
        | 'uninhabited-type-has-no-response-value-representation'
        | 'type-expression-is-erroneous'
        | 'object-shape-requires-property-level-provenance'
        | 'generic-type-arguments-require-declaration-aware-projection'
        | 'class-reference-binding-unresolved'
        | 'class-reference-binding-not-provided'
        | 'union-member-unresolved'
        | 'array-element-unresolved'
        | 'optional-type-requires-property-presence-semantics'
        | 'type-expression-is-unsupported';
      readonly source: SourceSpan;
    }>;

/**
 * Mapping obligations are intentionally conservative. PHP's int and float now
 * retain distinct upstream `integer` and `decimal` primitive variants, while the
 * legacy `number` variant remains intentionally ambiguous for response projection. Class references require
 * a canonical declaration binding; short names are not response identities.
 */
export interface LaravelDtoResponseValueProjectionContract {
  readonly kind: 'laravel_dto_response_value_projection_contract';
  readonly contractVersion: 3;
  readonly inputRule: 'consume-the-existing-TypeExpression-judgment-and-preserve-its-source-span';
  readonly primitiveRule: 'string-maps-to-textual;integer-maps-to-whole_number;decimal-maps-to-decimal_number;legacy-collapsed-number-json-date_time-file-and-unspecified-remain-unresolved-until-vocabulary-preserves-response-meaning';
  readonly referenceRule: 'a-class-reference-requires-a-canonical-declaration-binding-before-it-can-become-named_type';
  readonly arrayRule: 'array-maps-to-collection-only-when-the-element-expression-has-a-resolved-response-value-judgment';
  readonly unionRule: 'every-union-member-must-resolve;one-unresolved-member-blocks-the-entire-union';
  readonly nullableRule: 'nullable-expression-maps-to-a-union-of-the-resolved-inner-value-and-the-domain-null-value';
  readonly intersectionRule: 'intersection-is-unresolved-until-the-response-domain-can-preserve-intersection-semantics';
  readonly closureRule: 'unsupported-type-expressions-are-explicitly-unresolved-and-never-guessed-as-json';
  readonly provenanceRule: 'every-judgment-retains-the-exact-type-expression-source-span';
  readonly implementationRule: 'this-contract-owns-the-semantic-projection;runtime-executor-only-delegates-to-the-closed-judgment';
  readonly bindingRule: 'class-reference-projection-requires-an-explicit-resolved-property-binding-judgment';
}

/** Semantic projection contract; the implementation lives in the paired authority module. */
export interface LaravelDtoResponseValueProjectionInterface {
  readonly kind: 'laravel_dto_response_value_projection';
  readonly contract: LaravelDtoResponseValueProjectionContract;
  readonly project: (
    input: LaravelDtoResponseValueProjectionInput,
  ) => LaravelDtoResponseValueProjectionJudgment;
}

/** Authority role is an explicit upstream interface; concrete objects only implement this contract. */
export interface LaravelDtoResponseValueProjectionAuthorityInterface extends LaravelDtoResponseValueProjectionInterface {
  readonly authorityRole: 'semantic_judgment_owner';
}

/** Runtime executor contract only; it cannot independently interpret TypeExpression. */
export interface LaravelDtoResponseValueProjectionRuntimeExecutorInterface<
  Projection extends LaravelDtoResponseValueProjectionAuthorityInterface = LaravelDtoResponseValueProjectionAuthorityInterface,
> {
  readonly kind: 'laravel_dto_response_value_projection_runtime_executor';
  readonly closed: true;
  readonly contractVersion: 3;
  readonly projection: Projection;
  readonly contract: Projection['contract'];
  readonly execute: Projection['project'];
  readonly executionRule: 'delegate-to-the-bound-projection-interface-and-return-its-exact-judgment';
}
