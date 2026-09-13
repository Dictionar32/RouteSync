/**
 * types.ts
 *
 * Interfaces for validation rule mapping.
 *
 * @module core/compiler/generators/form-generation/field-mapper
 */

import type { SemanticType } from '../../../types/SemanticType';
import type { FileValidationConstraints } from '../../../artifacts/RequestTypesArtifact';

export interface ValidationRule {
  readonly rule: string;
  readonly parameters?: readonly string[];
}

export interface MappedField {
  readonly type: SemanticType;
  readonly fileConstraints?: FileValidationConstraints;
  readonly required: boolean;
  readonly nullable: boolean;
}
