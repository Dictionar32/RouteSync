/**
 * FormActionGenerator.ts
 * 
 * Small focused class: Generate action blocks (create/update).
 * Pure string generation with zero business logic.
 * 
 * Responsibility: Format action blocks untuk form types
 * 
 * @module compiler/generators/form-generation
 */

import type { RequestField } from '../../artifacts/RequestTypesArtifact';
import type { SemanticType } from '../../types/SemanticType';

function toCamelCase(str: string): string {
    return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Generated action block
 */
export interface GeneratedAction {
    /** Action name (create, update) */
    readonly name: string;

    /** Generated code lines */
    readonly lines: readonly string[];

    /** Field count */
    readonly fieldCount: number;
}

/**
 * FormActionGenerator - Pure formatting logic
 * 
 * Tiny puzzle piece (~60 lines) yang fokus pada formatting.
 * Takes structured data, returns formatted strings.
 * 
 * @example
 * ```typescript
 * const generator = new FormActionGenerator();
 * const action = generator.generateAction('create', fields);
 * // Returns:
 * // create: {
 * //   productId: number
 * //   quantity: number
 * // }
 * ```
 */
export class FormActionGenerator {
    /**
     * Generate action block dari fields
     * 
     * Pure function - predictable output for given input.
     * 
     * @param actionName - Action name (create/update)
     * @param fields - Array of request fields
     * @returns Generated action block
     */
    generateAction(
        actionName: string,
        fields: readonly RequestField[]
    ): GeneratedAction {
        const lines: string[] = [];

        // Action header
        lines.push(`  ${actionName.charAt(0).toUpperCase() + actionName.slice(1)}: {`);

        // Generate fields
        if (fields.length === 0) {
            lines.push('    // No fields');
        } else {
            for (const field of fields) {
                const tsType = this.convertSemanticTypeToString(field.type);
                const optional = !field.required ? '?' : '';
                const nullable = field.nullable ? ' | null' : '';

                const name = toCamelCase(field.transformedName);
                lines.push(`    ${name}${optional}: ${tsType}${nullable}`);
            }
        }

        // Action footer
        lines.push('  }');

        return {
            name: actionName,
            lines,
            fieldCount: fields.length
        };
    }

    /**
     * Convert SemanticType to TypeScript string
     * 
     * Simplified type conversion - handles common cases.
     * Complex types fallback to 'unknown'.
     */
    private convertSemanticTypeToString(type: SemanticType): string {
        switch (type.kind) {
            case 'primitive':
                // datetime → string (ISO strings in JSON)
                if (type.type === 'datetime') {
                    return 'string';
                }
                if (type.type === 'file') {
                    return 'File';
                }
                return type.type;

            case 'reference':
                return type.name;

            case 'readonly_collection':
            case 'mutable_collection':
                return `Array<${this.convertSemanticTypeToString(type.elementType)}>`;

            case 'union':
                return type.members.values()
                    .map((m: SemanticType) => this.convertSemanticTypeToString(m))
                    .join(' | ');

            case 'object': {
                const props = Array.from(type.properties.entries());
                if (props.length === 0) return 'Record<string, unknown>';
                const propLines = props.map(([propName, propType]) => {
                    return `${toCamelCase(propName)}: ${this.convertSemanticTypeToString(propType)}`;
                });
                return `{ ${propLines.join('; ')} }`;
            }

            case 'intersection':
                return type.members.values()
                    .map((m: SemanticType) => this.convertSemanticTypeToString(m))
                    .join(' & ');

            case 'never':
                return 'never';

            case 'error':
                return 'unknown';

            default:
                return 'unknown';
        }
    }
}
