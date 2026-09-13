/**
 * FormFieldMapper.ts
 * 
 * Maps validation rules to TypeScript types.
 * Pure transformation logic with zero side effects.
 * 
 * @module compiler/generators/form-generation
 */

import {
  type ValidationRule,
  type MappedField,
  mapRulesToField
} from './field-mapper';

export type { ValidationRule, MappedField };

export class FormFieldMapper {
  public mapValidationToType(rules: readonly ValidationRule[]): MappedField {
    return mapRulesToField(rules);
  }
}
