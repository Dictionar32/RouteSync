import { describe, expect, it } from 'vitest';
import type { ResponseValueContract } from '../../domain/responseContracts';
import type {
  LaravelDtoResponseValueProjectionContract,
  LaravelDtoResponseValueProjectionInterface,
  LaravelDtoResponseValueProjectionJudgment,
} from '../laravelDtoResponseValueProjectionInterface';
import type { TypeExpression } from '../typeVocabulary';

const contract: LaravelDtoResponseValueProjectionContract = {
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
};

describe('Laravel DTO response value projection interface contract', () => {
  it('keeps the type-expression mapping obligations explicit and versioned', () => {
    expect(contract.contractVersion).toBe(3);
    expect(contract.primitiveRule).toContain('integer-maps-to-whole_number');
    expect(contract.primitiveRule).toContain('decimal-maps-to-decimal_number');
    expect(contract.primitiveRule).toContain('legacy-collapsed-number');
    expect(contract.referenceRule).toContain('canonical-declaration-binding');
    expect(contract.closureRule).toContain('never-guessed-as-json');
  });

  it('admits only a closed resolved/unresolved judgment and an interface-owned projector', () => {
    const projector: Pick<LaravelDtoResponseValueProjectionInterface, 'project' | 'contract'> = {
      contract,
      project: (_input): LaravelDtoResponseValueProjectionJudgment => ({
        kind: 'laravel_dto_response_value_projection_unresolved',
        input: {
          kind: 'laravel_dto_response_value_projection_input',
          expression: { kind: 'mixed' } satisfies TypeExpression,
          source: { kind: 'source_span', file: { kind: 'source_file', value: { kind: 'string_value', value: 'UserDto.php' } }, start: { kind: 'number_value', value: 1 }, end: { kind: 'number_value', value: 2 } },
          referenceBinding: { kind: 'response_value_reference_binding_not_required' },
        },
        reason: 'primitive-vocabulary-does-not-preserve-response-meaning',
        source: { kind: 'source_span', file: { kind: 'source_file', value: { kind: 'string_value', value: 'UserDto.php' } }, start: { kind: 'number_value', value: 1 }, end: { kind: 'number_value', value: 2 } },
      }),
    };
    const value: ResponseValueContract = { kind: 'scalar', value: { kind: 'textual' } };
    expect(projector.contract.kind).toBe('laravel_dto_response_value_projection_contract');
    expect(value.kind).toBe('scalar');
  });
});
