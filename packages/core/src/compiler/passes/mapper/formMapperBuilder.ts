/**
 * formMapperBuilder.ts
 *
 * Generates form mappers: form values -> API payload (snake_case, via ApiApiField bracket notation).
 * Active Consumer orchestrating form mapper function generation.
 *
 * @module compiler/passes/mapper/formMapperBuilder
 */

import { toPascalResourceName, propertyNameText, toPascalCase } from '../../../utils/resource-naming';
import { relationProject } from '../../../semantic/foundation/relationalSequence';
import type { RequestType } from '../../artifacts/RequestTypesArtifact';
import type { PropertyName } from '../../../types/upstream/names';
import { buildFormFieldLine } from './formFieldLineBuilder';

export { buildFormFieldLine };

export function toApiFieldKey(originalName: PropertyName): string {
    return propertyNameText(originalName).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Builds a single form-to-API mapper function for a resource action.
 */
export function buildFormMapper(
    requestType: RequestType,
    action: RequestType['actions'][number]
): string {
    const resource = toPascalResourceName(requestType.identity.resource);
    const actionName = toPascalCase(action.name);
    const formTypeName = requestType.identity.source.formType.value.value;
    const contractTypeName = `${resource}Contract`;

    const fieldLines = relationProject(action.fields, field => buildFormFieldLine(field)).join('\n');

    return (
        `export const toApi${resource}${actionName} = (form: ${formTypeName}['${actionName}']): ${contractTypeName}['${actionName}'] => ({\n` +
        `${fieldLines}\n` +
        `})`
    );
}
