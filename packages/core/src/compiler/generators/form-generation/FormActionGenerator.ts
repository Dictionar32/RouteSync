/**
 * FormActionGenerator.ts
 *
 * Generates TypeScript action blocks for form types.
 * Structured Constructor consuming SemanticTypeResolver SSOT & TypeScriptTypeLowerer.
 *
 * @module compiler/generators/form-generation
 */

import type { SemanticType } from '../../types/SemanticType';
import type { RequestField } from '../../artifacts/RequestTypesArtifact';
import { SemanticTypeResolver } from '../../domain/common/SemanticTypeResolver';
import { defaultTypeResolver } from '../../domain/common/ResponseFieldLowering';
import { toCamelCase, toPascalCase } from '../../../utils/resource-naming';

export interface GeneratedFormAction {
    readonly name: string;
    readonly lines: readonly string[];
    readonly fieldCount: number;
}

export interface FormActionGeneratorDependencies {
    readonly resolver?: SemanticTypeResolver;
}

export class FormActionGenerator {
    private readonly resolver: SemanticTypeResolver;

    constructor({ resolver = defaultTypeResolver }: FormActionGeneratorDependencies = {}) {
        this.resolver = resolver;
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
                const tsType = this.convertSemanticTypeToString(field.type);
                const optional = !field.required ? '?' : '';
                const nullable = field.nullable ? ' | null' : '';
                const fieldName = toCamelCase(field.transformedName || (field as any).name || field.originalName || '');

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

    private convertSemanticTypeToString(type: SemanticType): string {
        switch (type.kind) {
            case 'primitive':
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
                return Array.from(type.members.values())
                    .map((m: SemanticType) => this.convertSemanticTypeToString(m))
                    .join(' | ');

            case 'intersection':
                return Array.from(type.members.values())
                    .map((m: SemanticType) => this.convertSemanticTypeToString(m))
                    .join(' & ');

            case 'object': {
                let propList: readonly [string, SemanticType][] = [];
                if (Array.isArray((type as any).properties) && (type as any).properties.length > 0) {
                    propList = (type as any).properties.map((p: any) => [p.name, p.type]);
                } else if ((type as any).properties && typeof (type as any).properties.entries === 'function') {
                    propList = Array.from((type as any).properties.entries());
                }
                if (propList.length === 0) return 'Record<string, unknown>';
                const propLines = propList.map(([propName, propType]) => {
                    return `${toCamelCase(propName)}: ${this.convertSemanticTypeToString(propType)}`;
                });
                return `{ ${propLines.join('; ')} }`;
            }

            case 'optional':
                return `${this.convertSemanticTypeToString(type.innerType)} | undefined`;

            case 'nullable':
                return `${this.convertSemanticTypeToString(type.innerType)} | null`;

            case 'never':
                return 'never';

            case 'error':
            default:
                return 'unknown';
        }
    }
}