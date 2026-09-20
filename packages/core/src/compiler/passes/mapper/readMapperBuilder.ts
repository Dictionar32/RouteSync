/**
 * readMapperBuilder.ts
 *
 * Generates read mappers: API response (snake_case) -> transformed frontend model (camelCase).
 * Active Consumer orchestrating read mapper function generation.
 *
 * @module compiler/passes/mapper/readMapperBuilder
 */

import { toPascalCase } from '../../../utils/resource-naming';
import type { ResourceMappingIntentGraph } from '../../../types/domain/mappingIntent';
import {
    indent,
    buildFieldMappingLine,
    resolveResourceBaseName
} from './readFieldLineBuilder';

export { indent, buildFieldMappingLine, resolveResourceBaseName };

/**
 * Builds toXRead and toXReadList mappers from a set of semantic fields.
 */
export function buildReadMapperFromFields(
    graph: ResourceMappingIntentGraph,
    paramType?: string
): string {
    const resource = toPascalCase(graph.resourceName);
    const returnType = `${resource}Transformed`;
    const apiType = paramType ?? `${resource}ApiResponse`;

    const fieldLines = graph.fields
        .map(field => buildFieldMappingLine(field.name, field.intent, `api.${field.name}`))
        .join('\n');

    const readFn =
        `export const to${resource}Read = (api: ${apiType}): ${returnType} => ({\n` +
        `${fieldLines}\n` +
        `})`;

    const readListFn =
        `export const to${resource}ReadList = (api: ${apiType}[]): ${returnType}[] => api.map(to${resource}Read)`;

    return `${readFn}\n\n${readListFn}`;
}
