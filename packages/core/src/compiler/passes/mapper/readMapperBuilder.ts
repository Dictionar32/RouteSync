/**
 * readMapperBuilder.ts
 *
 * Generates read mappers: API response (snake_case) -> transformed frontend model (camelCase).
 * Active Consumer orchestrating read mapper function generation.
 *
 * @module compiler/passes/mapper/readMapperBuilder
 */

import { toPascalResourceName, propertyNameText } from '../../../utils/resource-naming';
import { relationProject } from '../../../semantic/kernel/semanticRelations';
import type { ResourceMappingIntentGraph } from '../../../types/domain/mappingIntent';
import {
    indent,
    buildFieldMappingLine
} from './readFieldLineBuilder';

export { indent, buildFieldMappingLine };

/**
 * Builds toXRead and toXReadList mappers from a set of semantic fields.
 */
export function buildReadMapperFromFields(
    graph: ResourceMappingIntentGraph,
    apiResponseType: string
): string {
    const resource = toPascalResourceName(graph.resourceName);
    const returnType = `${resource}Transformed`;
    const apiType = apiResponseType;

    const fieldLines = relationProject(
        graph.fields,
        field => buildFieldMappingLine(field.name, field.intent, `api.${propertyNameText(field.name)}`),
    ).join('\n');

    const readFn =
        `export const to${resource}Read = (api: ${apiType}): ${returnType} => ({\n` +
        `${fieldLines}\n` +
        `})`;

    const readListFn =
        `export const to${resource}ReadList = (api: ${apiType}[]): ${returnType}[] => api.map(to${resource}Read)`;

    return `${readFn}\n\n${readListFn}`;
}
