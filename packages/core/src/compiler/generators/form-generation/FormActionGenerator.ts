import { PrimitiveKind } from '../../types/SemanticType';
/**
 * FormActionGenerator.ts
 *
 * Generates TypeScript action blocks for form types.
 * Structured Constructor consuming SemanticTypeResolver SSOT & TypeScriptTypeLowerer.
 *
 * @module compiler/generators/form-generation
 */

import type { RequestFieldMeaning } from '../../../types/domain/requestFieldMeaning';
import type { RequestField } from '../../../types/domain/request';
import { toCamelCase, toPascalCase } from '../../../utils/resource-naming';

export interface GeneratedFormAction {
    readonly name: string;
    readonly lines: readonly string[];
    readonly fieldCount: number;
}

export interface FormActionGeneratorDependencies {
}

export class FormActionGenerator {
    constructor(_dependencies: FormActionGeneratorDependencies = {}) {
        Object.freeze(this);
    }

    generateAction(
        actionName: string,
        fields: readonly RequestField[]
    ): GeneratedFormAction {
        const formattedActionName = toPascalCase(actionName);
        const lines: string[] = [];

        lines.push(`  ${formattedActionName}: {`);

        if (fields.length === 0) {
            lines.push('    // No fields');
        } else {
            for (const field of fields) {
                const tsType = this.convertMeaningToString(field.meaning);
                const optional = field.presence.accept({ required: () => '', optional: () => '?', unspecified: () => { throw new Error(`Request field '${field.sourceName.value}' has unspecified presence`); } });
                const nullable = field.presence.accept({ required: p => p.nullable ? ' | null' : '', optional: p => p.nullable ? ' | null' : '', unspecified: () => { throw new Error(`Request field '${field.sourceName.value}' has unspecified nullability`); } });
                const fieldName = field.name;

                lines.push(`    ${fieldName}${optional}: ${tsType}${nullable}`);
            }
        }

        lines.push('  }');

        return {
            name: actionName,
            lines,
            fieldCount: fields.length
        };
    }

    private convertMeaningToString(meaning: RequestFieldMeaning): string {
        return meaning.accept({
            scalar: value => ({
                [PrimitiveKind.STRING]: 'string',
                [PrimitiveKind.NUMBER]: 'number',
                [PrimitiveKind.BOOLEAN]: 'boolean',
                [PrimitiveKind.DATETIME]: 'string',
                [PrimitiveKind.FILE]: 'File',
                [PrimitiveKind.UNKNOWN]: 'unknown',
                [PrimitiveKind.UNSPECIFIED]: 'unknown'
            }[value.scalar]),
            object: value => value.fields.length === 0 ? 'Record<string, unknown>' : `{ ${value.fields.map(field => `${field.name.value}: ${this.convertMeaningToString(field.meaning)}`).join('; ')} }`,
            resource: value => value.resourceName.value,
            collection: value => `Array<${this.convertMeaningToString(value.element)}>`,
            resourceCollection: value => `Array<${value.resourceName.value}>`,
            jsonValue: () => 'unknown',
            never: () => 'never',
            error: value => value.diagnosticMessage.value,
            union: value => value.members.map(member => this.convertMeaningToString(member)).join(' | '),
            intersection: value => value.members.map(member => this.convertMeaningToString(member)).join(' & '),
            generic: value => this.convertMeaningToString(value.base)
        });
    }
}
