/**
 * Canonical field-mapper vocabulary. No free-form validation rule shape is
 * accepted beyond the domain ValidationRuleNode ADT.
 */
import type { SemanticType } from '../../../types/SemanticType';
import type { FileValidationConstraints } from '../../../types/domain/request';
import type { ValidationRuleNode } from '../../../types/domain/validationRules';

export type ValidationRule = ValidationRuleNode;

export interface MappedField {
  readonly type: SemanticType;
  readonly fileConstraints: FileValidationConstraints;
  readonly required: boolean;
  readonly nullable: boolean;
}
