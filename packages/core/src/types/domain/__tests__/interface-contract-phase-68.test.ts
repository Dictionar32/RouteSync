import { describe, expectTypeOf, it } from 'vitest';
import type {
  ArrayValidationRuleNode,
  BetweenValidationRuleNode,
  CustomValidationRuleNode,
  DateValidationRuleNode,
  ExistsValidationRuleNode,
  InValidationRuleNode,
  MinValidationRuleNode,
  ValidationRuleSpecification,
} from '../validationRules';
import type {
  ColumnName,
  DateFormat,
  TableName,
  ValidationConstraintValue,
  ValidationParameter,
  ValidationRuleName,
} from '../semanticValues';
import type { SemanticType } from '../../compiler/types/SemanticType';

describe('Phase 68 validation rule interface contract', () => {
  it('uses semantic types for array element contracts', () => {
    expectTypeOf<ArrayValidationRuleNode['elementType']>().toEqualTypeOf<
      SemanticType | null
    >();
  });

  it('uses a qualified date format', () => {
    expectTypeOf<DateValidationRuleNode['format']>().toEqualTypeOf<DateFormat | null>();
  });

  it('qualifies numeric constraint values', () => {
    expectTypeOf<MinValidationRuleNode['value']>().toEqualTypeOf<ValidationConstraintValue>();
    expectTypeOf<BetweenValidationRuleNode['min']>().toEqualTypeOf<ValidationConstraintValue>();
    expectTypeOf<BetweenValidationRuleNode['max']>().toEqualTypeOf<ValidationConstraintValue>();
  });

  it('qualifies membership values', () => {
    expectTypeOf<InValidationRuleNode['values']>().toEqualTypeOf<
      readonly ValidationParameter[]
    >();
  });

  it('qualifies database references', () => {
    expectTypeOf<ExistsValidationRuleNode['table']>().toEqualTypeOf<TableName>();
    expectTypeOf<ExistsValidationRuleNode['column']>().toEqualTypeOf<ColumnName | null>();
  });

  it('qualifies custom rule identity and parameters', () => {
    expectTypeOf<CustomValidationRuleNode['rule']>().toEqualTypeOf<ValidationRuleName>();
    expectTypeOf<CustomValidationRuleNode['parameters']>().toEqualTypeOf<
      readonly ValidationParameter[]
    >();
  });

  it('removes redundant boolean classification flags from specifications', () => {
    expectTypeOf<ValidationRuleSpecification>().not.toHaveProperty('isTypeAssertion');
    expectTypeOf<ValidationRuleSpecification>().not.toHaveProperty('isConstraint');
    expectTypeOf<ValidationRuleSpecification>().not.toHaveProperty('isModifier');
  });
});
