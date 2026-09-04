/**
 * FormCodeBuilder.ts
 *
 * Assembles final TypeScript Form code artifacts.
 *
 * @module compiler/generators/form-generation
 */

import type { GeneratedFormAction } from './FormActionGenerator';
import { toPascalCase } from '../../../utils/resource-naming';

export interface FormTypeDefinition {
    readonly resourceName: string;
    readonly formTypeName: string;
    readonly actions: readonly GeneratedFormAction[];
}

export interface FormCodeBuilderInput {
    readonly formTypes: readonly FormTypeDefinition[];
}

export interface FormCodeBuilderOptions {
    readonly indentSize?: number;
}

export class FormCodeBuilder {
    private readonly indentSize: number;

    constructor({ indentSize = 2 }: FormCodeBuilderOptions = {}) {
        this.indentSize = indentSize;
    }

    build({ formTypes }: FormCodeBuilderInput): string {
        const lines: string[] = [
            '/**',
            ' * Generated Form Types',
            ' * Do not edit directly.',
            ' */',
            ''
        ];

        for (const formType of formTypes) {
            const typeName = toPascalCase(formType.formTypeName);
            lines.push(`export type ${typeName} = {`);
            for (const action of formType.actions) {
                lines.push(action.lines.join('\n'));
            }
            lines.push('};');
            lines.push('');
        }

        return lines.join('\n');
    }
}