import { createResponseTypeName } from './names';
import type { ResponseValueContract } from '../domain/responseContracts';
import type { TypeExpression } from './typeVocabulary';
import type {
  LaravelDtoResponseValueProjectionContract,
  LaravelDtoResponseValueProjectionInput,
  LaravelDtoResponseValueProjectionAuthorityInterface,
  LaravelDtoResponseValueProjectionJudgment,
  LaravelDtoResponseValueProjectionRuntimeExecutorInterface,
  LaravelDtoResponseValueReferenceBindingEvidence,
} from './laravelDtoResponseValueProjectionInterface';

export const LARAVEL_DTO_RESPONSE_VALUE_PROJECTION_CONTRACT: LaravelDtoResponseValueProjectionContract = Object.freeze({
  kind: 'laravel_dto_response_value_projection_contract',
  contractVersion: 3,
  inputRule: 'consume-the-existing-TypeExpression-judgment-and-preserve-its-source-span',
  primitiveRule: 'string-maps-to-textual;integer-maps-to-whole_number;decimal-maps-to-decimal_number;legacy-collapsed-number-json-date_time-file-and-unspecified-remain-unresolved-until-vocabulary-preserves-response-meaning',
  referenceRule: 'a-class-reference-requires-a-canonical-declaration-binding-before-it-can-become-named_type',
  arrayRule: 'array-maps-to-collection-only-when-the-element-expression-has-a-resolved-response-value-judgment',
  unionRule: 'every-union-member-must-resolve;one-unresolved-member-blocks-the-entire-union',
  nullableRule: 'nullable-expression-maps-to-a-union-of-the-resolved-inner-value-and-the-domain-null-value',
  intersectionRule: 'intersection-is-unresolved-until-the-response-domain-can-preserve-intersection-semantics',
  closureRule: 'unsupported-type-expressions-are-explicitly-unresolved-and-never-guessed-as-json',
  provenanceRule: 'every-judgment-retains-the-exact-type-expression-source-span',
  implementationRule: 'this-contract-owns-the-semantic-projection;runtime-executor-only-delegates-to-the-closed-judgment',
  bindingRule: 'class-reference-projection-requires-an-explicit-resolved-property-binding-judgment',
});

type ProjectionResult =
  | Readonly<{ readonly kind: 'response_value_projection_value'; readonly value: ResponseValueContract }>
  | Readonly<{ readonly kind: 'response_value_projection_unresolved'; readonly reason: Extract<LaravelDtoResponseValueProjectionJudgment, { readonly kind: 'laravel_dto_response_value_projection_unresolved' }>['reason'] }>;

const notRequired: LaravelDtoResponseValueReferenceBindingEvidence = Object.freeze({ kind: 'response_value_reference_binding_not_required' });

const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  items.kind === 'empty' ? output : sequenceToArray(items.tail, Object.freeze([...output, items.head]));

function projectPrimitive(expression: Extract<TypeExpression, { readonly kind: 'primitive' }>): ProjectionResult {
  switch (expression.value.kind) {
    case 'string':
      return Object.freeze({ kind: 'response_value_projection_value', value: Object.freeze({ kind: 'scalar', value: Object.freeze({ kind: 'textual' }) }) });
    case 'integer':
      return Object.freeze({ kind: 'response_value_projection_value', value: Object.freeze({ kind: 'scalar', value: Object.freeze({ kind: 'whole_number' }) }) });
    case 'decimal':
      return Object.freeze({ kind: 'response_value_projection_value', value: Object.freeze({ kind: 'scalar', value: Object.freeze({ kind: 'decimal_number' }) }) });
    case 'boolean':
      return Object.freeze({ kind: 'response_value_projection_value', value: Object.freeze({ kind: 'scalar', value: Object.freeze({ kind: 'boolean_flag' }) }) });
    case 'number':
    case 'date_time':
    case 'file':
    case 'json':
    case 'unspecified':
      return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'primitive-vocabulary-does-not-preserve-response-meaning' });
  }
}

function projectExpression(
  expression: TypeExpression,
  referenceBinding: LaravelDtoResponseValueReferenceBindingEvidence,
): ProjectionResult {
  switch (expression.kind) {
    case 'primitive':
      return projectPrimitive(expression);
    case 'reference': {
      switch (expression.value.kind) {
        case 'domain':
          return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'class-reference-requires-canonical-declaration-binding' });
        case 'class':
          switch (referenceBinding.kind) {
            case 'response_value_reference_binding_not_required':
              return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'class-reference-binding-not-provided' });
            case 'response_value_reference_binding_required':
              switch (referenceBinding.judgment.kind) {
                case 'laravel_dto_type_reference_unresolved':
                  return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'class-reference-binding-unresolved' });
                case 'laravel_dto_type_reference_bound':
                  return Object.freeze({
                    kind: 'response_value_projection_value',
                    value: Object.freeze({
                      kind: 'named_type',
                      name: createResponseTypeName(referenceBinding.judgment.declarationJudgment.identity.className.value.value),
                    }),
                  });
              }
          }
      }
      return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'class-reference-binding-not-provided' });
    }
    case 'array': {
      const element = projectExpression(expression.element, notRequired);
      switch (element.kind) {
        case 'response_value_projection_unresolved':
          return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'array-element-unresolved' });
        case 'response_value_projection_value':
          return Object.freeze({ kind: 'response_value_projection_value', value: Object.freeze({ kind: 'collection', element: element.value }) });
      }
    }
    case 'nullable': {
      const inner = projectExpression(expression.value, referenceBinding);
      switch (inner.kind) {
        case 'response_value_projection_unresolved':
          return inner;
        case 'response_value_projection_value':
          return Object.freeze({
            kind: 'response_value_projection_value',
            value: Object.freeze({ kind: 'union', members: Object.freeze([inner.value, Object.freeze({ kind: 'null' })]) }),
          });
      }
    }
    case 'union': {
      const members = sequenceToArray(expression.members.items);
      switch (members.length > 0) {
        case false:
          return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'union-member-unresolved' });
        case true: {
          const projections = members.map(member => projectExpression(member, notRequired));
          const unresolvedMember = projections.find(result => result.kind === 'response_value_projection_unresolved');
          switch (unresolvedMember?.kind) {
            case 'response_value_projection_unresolved':
              return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'union-member-unresolved' });
            case undefined:
              return Object.freeze({
                kind: 'response_value_projection_value',
                value: Object.freeze({
                  kind: 'union',
                  members: Object.freeze(projections.flatMap(result => result.kind === 'response_value_projection_value' ? [result.value] : [])),
                }),
              });
          }
        }
      }
    }
    case 'array_map':
      return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'array-map-requires-explicit-key-value-response-representation' });
    case 'intersection':
      return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'intersection-has-no-faithful-response-value-representation' });
    case 'callable':
      return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'callable-has-no-response-value-representation' });
    case 'optional':
      return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'optional-type-requires-property-presence-semantics' });
    case 'uninhabited':
      return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'uninhabited-type-has-no-response-value-representation' });
    case 'error':
      return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'type-expression-is-erroneous' });
    case 'object':
      return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'object-shape-requires-property-level-provenance' });
    case 'generic':
      return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'generic-type-arguments-require-declaration-aware-projection' });
    case 'mixed':
      return Object.freeze({ kind: 'response_value_projection_unresolved', reason: 'primitive-vocabulary-does-not-preserve-response-meaning' });
  }
}

export const laravelDtoResponseValueProjectionAuthority: LaravelDtoResponseValueProjectionAuthorityInterface = Object.freeze({
  authorityRole: 'semantic_judgment_owner',
  kind: 'laravel_dto_response_value_projection',
  contract: LARAVEL_DTO_RESPONSE_VALUE_PROJECTION_CONTRACT,
  project: (input: LaravelDtoResponseValueProjectionInput): LaravelDtoResponseValueProjectionJudgment => {
    const result = projectExpression(input.expression, input.referenceBinding);
    switch (result.kind) {
      case 'response_value_projection_value':
        return Object.freeze({ kind: 'laravel_dto_response_value_projection_resolved', input, value: result.value });
      case 'response_value_projection_unresolved':
        return Object.freeze({ kind: 'laravel_dto_response_value_projection_unresolved', input, reason: result.reason, source: input.source });
    }
  },
});

export const laravelDtoResponseValueProjectionRuntimeExecutor: LaravelDtoResponseValueProjectionRuntimeExecutorInterface = Object.freeze({
  kind: 'laravel_dto_response_value_projection_runtime_executor',
  closed: true,
  contractVersion: 3,
  projection: laravelDtoResponseValueProjectionAuthority,
  contract: laravelDtoResponseValueProjectionAuthority.contract,
  execute: laravelDtoResponseValueProjectionAuthority.project,
  executionRule: 'delegate-to-the-bound-projection-interface-and-return-its-exact-judgment',
});
