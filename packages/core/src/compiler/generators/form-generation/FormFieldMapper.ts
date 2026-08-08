/**
 * FormFieldMapper.ts
 * 
 * Small focused class: Maps validation rules to TypeScript types.
 * Pure transformation logic with zero side effects.
 * 
 * Responsibility: Convert Laravel validation rules → SemanticType
 * 
 * @module compiler/generators/form-generation
 */

import { PrimitiveType, PrimitiveKind } from '../../types/SemanticType';
import type { SemanticType } from '../../types/SemanticType';

/**
 * Laravel validation rule (simplified)
 */
export interface ValidationRule {
    /** Rule name (e.g., 'required', 'string', 'integer') */
    readonly rule: string;

    /** Additional parameters for rule */
    readonly parameters?: readonly string[];
}

/**
 * Field mapping result
 */
export interface MappedField {
    /** TypeScript type untuk field */
    readonly type: SemanticType;

    /** Is this field required? */
    readonly required: boolean;

    /** Is this field nullable? */
    readonly nullable: boolean;
}

/**
 * FormFieldMapper - Pure transformation logic
 * 
 * Tiny puzzle piece (~50 lines) yang fokus pada satu hal:
 * Convert validation rules ke TypeScript types.
 * 
 * @example
 * ```typescript
 * const mapper = new FormFieldMapper();
 * const result = mapper.mapValidationToType([
 *   { rule: 'required' },
 *   { rule: 'string' },
 *   { rule: 'max', parameters: ['255'] }
 * ]);
 * // result.type = PrimitiveType('string')
 * // result.required = true
 * // result.nullable = false
 * ```
 */
export class FormFieldMapper {
    /**
     * Map validation rules to TypeScript type
     * 
     * Pure function - no side effects, no state mutation.
     * 
     * @param rules - Array of Laravel validation rules
     * @returns Mapped field with type and modifiers
     */
    mapValidationToType(rules: readonly ValidationRule[]): MappedField {
        let baseType: SemanticType = new PrimitiveType(PrimitiveKind.STRING); // Default type
        let required = false;
        let nullable = false;

        // Scan rules untuk extract type info
        for (const rule of rules) {
            switch (rule.rule) {
                case 'required':
                    required = true;
                    break;

                case 'nullable':
                    nullable = true;
                    break;

                case 'string':
                    baseType = new PrimitiveType(PrimitiveKind.STRING);
                    break;

                case 'integer':
                case 'numeric':
                    baseType = new PrimitiveType(PrimitiveKind.NUMBER);
                    break;

                case 'boolean':
                    baseType = new PrimitiveType(PrimitiveKind.BOOLEAN);
                    break;

                case 'array':
                    // Array type - default to string[] for simplicity
                    baseType = new PrimitiveType(PrimitiveKind.STRING);
                    break;

                case 'date':
                case 'date_format':
                    // Dates are ISO strings in JSON
                    baseType = new PrimitiveType(PrimitiveKind.DATETIME);
                    break;

                case 'json':
                    // JSON fields are strings in forms
                    baseType = new PrimitiveType(PrimitiveKind.STRING);
                    break;

                // Ignore validation-only rules (they don't affect type)
                case 'max':
                case 'min':
                case 'email':
                case 'url':
                case 'regex':
                case 'unique':
                case 'exists':
                case 'confirmed':
                    // These don't change the base type
                    break;

                default:
                    // Unknown rule - ignore silently
                    break;
            }
        }

        return {
            type: baseType,
            required,
            nullable
        };
    }
}
