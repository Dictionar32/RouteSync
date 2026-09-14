/**
 * formMapperBuilder.ts
 *
 * Generates form mappers: form values -> API payload (snake_case, via ApiApiField bracket notation).
 * Active Consumer orchestrating form mapper function generation.
 *
 * @module compiler/passes/mapper/formMapperBuilder
 */

import { toPascalCase } from '../../../utils/resource-naming';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import {
    extractObjectPropertyNames,
    buildFormFieldLine
} from './formFieldLineBuilder';

export { extractObjectPropertyNames, buildFormFieldLine };

export function toApiFieldKey(originalName: string): string {
    return originalName.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Builds a single form-to-API mapper function for a resource action.
 */
export function buildFormMapper(
    requestType: RequestType,
    action: RequestType['actions'][number],
    contractTypeName: string
): string {
    const resource = toPascalCase(requestType.resourceName);
    const actionName = toPascalCase(action.name);
    const formTypeName = requestType.formTypeName && requestType.formTypeName.endsWith('Form')
        ? requestType.formTypeName
        : resource + 'Form';

    const fieldLines = action.fields
        .map(field => buildFormFieldLine(field))
        .join('\n');

    return (
        `export const toApi${resource}${actionName} = (form: ${formTypeName}['${actionName}']): ${contractTypeName}['${actionName}'] => ({\n` +
        `${fieldLines}\n` +
        `})`
    );
}
