import { describe, expectTypeOf, it } from 'vitest';
import type {
  ArrayElementType,
  DateFormatSpecification,
  ExistsValidationRuleNode,
  UniqueValidationRuleNode,
  ValidationDatabaseColumn,
} from '../validationRules';

describe('validation interface contract phase 69', () => {
  it('does not encode array element absence with null', () => {
    expectTypeOf<ArrayElementType>().toMatchTypeOf<
      { readonly kind: 'unspecified' } | { readonly kind: 'specified' }
    >();
  });

  it('does not encode date format absence with null', () => {
    expectTypeOf<DateFormatSpecification>().toMatchTypeOf<
      { readonly kind: 'unspecified' } | { readonly kind: 'specified' }
    >();
  });

  it('does not encode database column absence with null', () => {
    expectTypeOf<ValidationDatabaseColumn>().toMatchTypeOf<
      { readonly kind: 'default_column' } | { readonly kind: 'explicit_column' }
    >();
    expectTypeOf<ExistsValidationRuleNode['column']>().toEqualTypeOf<ValidationDatabaseColumn>();
    expectTypeOf<UniqueValidationRuleNode['column']>().toEqualTypeOf<ValidationDatabaseColumn>();
  });
});
