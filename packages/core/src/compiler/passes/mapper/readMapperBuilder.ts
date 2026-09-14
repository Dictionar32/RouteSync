/**
 * readMapperBuilder.ts
 *
 * Generates read mappers: API response (snake_case) -> transformed frontend model (camelCase).
 * Active Consumer orchestrating read mapper function generation.
 *
 * @module compiler/passes/mapper/readMapperBuilder
 */

import { toPascalCase } from '../../../utils/resource-naming';
import type { SemanticType } from '../../types/SemanticType';
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
    resourceName: string,
    fields: Record<string, SemanticType>,
    isEloquentResource: boolean,
    paramType?: string
): string {
    const resource = toPascalCase(resourceName);
    const returnType = `${resource}Transformed`;
    const apiType = paramType ?? `${resource}ApiResponse`;

    const fieldLines = Object.entries(fields)
        .map(([key, type]) => buildFieldMappingLine(key, type, `api.${key}`, isEloquentResource))
        .join('\n');

    const readFn =
        `export const to${resource}Read = (api: ${apiType}): ${returnType} => ({\n` +
        `${fieldLines}\n` +
        `})`;

    const readListFn =
        `export const to${resource}ReadList = (api: ${apiType}[]): ${returnType}[] => api.map(to${resource}Read)`;

    return `${readFn}\n\n${readListFn}`;
}
