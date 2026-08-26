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

import { PrimitiveType, PrimitiveKind, ReadonlyCollectionType, CollectionKind } from '../../types/SemanticType';
import type { SemanticType } from '../../types/SemanticType';
import type { FileValidationConstraints } from '../../artifacts/RequestTypesArtifact';

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

    /** File validation constraints retained for contract generation. */
    readonly fileConstraints?: FileValidationConstraints;

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
        let isFile = false;
        let image = false;
        const extensions = new Set<string>();
        const mimeTypes = new Set<string>();
        let maxKilobytes: number | undefined;

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
                    // Array type — elemen default string. Contract parser dapat
                    // meng-upgrade elemen jadi ObjectType via wildcard (items.*.x).
                    baseType = new ReadonlyCollectionType(
                        CollectionKind.ARRAY,
                        new PrimitiveType(PrimitiveKind.STRING)
                    );
                    break;

                case 'date':
                case 'date_format':
                    // Dates are ISO strings in JSON
                    baseType = new PrimitiveType(PrimitiveKind.DATETIME);
                    break;

                // Laravel treats all of these as uploaded files. `image`,
                // `mimes`, and `mimetypes` are file constraints as well, even
                // when an explicit `file` rule is omitted.
                case 'file':
                    isFile = true;
                    baseType = new PrimitiveType(PrimitiveKind.FILE);
                    break;
                case 'image':
                    isFile = true;
                    image = true;
                    baseType = new PrimitiveType(PrimitiveKind.FILE);
                    break;
                case 'mimes':
                    isFile = true;
                    for (const extension of rule.parameters ?? []) {
                        extensions.add(extension.toLowerCase());
                    }
                    baseType = new PrimitiveType(PrimitiveKind.FILE);
                    break;
                case 'mimetypes':
                    isFile = true;
                    for (const mimeType of rule.parameters ?? []) {
                        mimeTypes.add(mimeType.toLowerCase());
                    }
                    baseType = new PrimitiveType(PrimitiveKind.FILE);
                    break;

                case 'json':
                    // JSON fields are strings in forms
                    baseType = new PrimitiveType(PrimitiveKind.STRING);
                    break;

                // Ignore validation-only rules (they don't affect type)
                case 'max':
                    // Laravel's `max` for an uploaded file is expressed in KB.
                    if (rule.parameters?.[0] && Number.isFinite(Number(rule.parameters[0]))) {
                        maxKilobytes = Number(rule.parameters[0]);
                    }
                    break;
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

        const fileConstraints = isFile
            ? {
                ...(image ? { image: true } : {}),
                ...(extensions.size > 0 ? { extensions: Array.from(extensions) } : {}),
                ...(mimeTypes.size > 0 ? { mimeTypes: Array.from(mimeTypes) } : {}),
                ...(maxKilobytes !== undefined ? { maxBytes: maxKilobytes * 1024 } : {}),
            }
            : undefined;

        return {
            type: baseType,
            fileConstraints,
            required,
            nullable
        };
    }
}
