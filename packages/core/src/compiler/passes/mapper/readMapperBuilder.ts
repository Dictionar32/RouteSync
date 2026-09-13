/**
 * readMapperBuilder.ts
 *
 * Generates read mappers: API response (snake_case) -> transformed frontend model (camelCase).
 * Handles scalar fields, nested objects, child resource mappings, and collections.
 *
 * @module compiler/passes/mapper/readMapperBuilder
 */

import { toPascalCase, toCamelCase } from '../../../utils/resource-naming';
import {
    ObjectType,
    ReadonlyCollectionType,
    MutableCollectionType,
    ReferenceType,
    type SemanticType,
    type ObjectProperty
} from '../../types/SemanticType';

export function indent(block: string): string {
    return block
        .split('\n')
        .map(line => `  ${line}`)
        .join('\n');
}

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

/**
 * Build a single `key: api.path` (or nested object literal) mapping
 * line for a response field. Recurses into ObjectType fields so nested
 * objects stay nested.
 */
export function buildFieldMappingLine(
    targetPropKey: string,
    type: SemanticType,
    jsonPath: string,
    isEloquentResource: boolean
): string {
    const camelProp = toCamelCase(targetPropKey);

    if (type instanceof ObjectType) {
        if (type.annotations?.get('kind') === 'nullable_wrapper') {
            const innerVal = type.properties.get('__value');
            if (innerVal) {
                return buildFieldMappingLine(targetPropKey, innerVal, jsonPath, isEloquentResource);
            }
        }
        return (type.properties as readonly ObjectProperty[])
            .filter(p => !p.name.startsWith('__'))
            .map(p => {
                const childTargetPropKey = targetPropKey
                    ? `${targetPropKey}_${p.name}`
                    : p.name;
                const childJsonPath = `${jsonPath}.${p.name}`;
                return buildFieldMappingLine(childTargetPropKey, p.type, childJsonPath, isEloquentResource);
            })
            .join('\n');
    }

    if (type instanceof ReadonlyCollectionType || type instanceof MutableCollectionType) {
        const elem = type.elementType;
        let elemResourceName: string | null = null;
        if (elem instanceof ReferenceType && elem.name.includes('Resource')) {
            const baseName = elem.name.replace(/Transformed$/, '');
            elemResourceName = toPascalCase(baseName);
        } else if (elem instanceof ObjectType) {
            const metaName = elem.annotations?.get('name') ?? (elem as any).metadata?.get('name');
            if (metaName && metaName.includes('Resource')) {
                const baseName = metaName.replace(/Transformed$/, '');
                elemResourceName = toPascalCase(baseName);
            }
        }

        if (elemResourceName) {
            return `  ${camelProp}: ${jsonPath}?.map(to${elemResourceName}Read),`;
        }

        if (elem instanceof ObjectType && (elem.properties as readonly ObjectProperty[]).length > 0) {
            const itemFieldLines = (elem.properties as readonly ObjectProperty[])
                .filter(p => !p.name.startsWith('__'))
                .map(p =>
                    buildFieldMappingLine(p.name, p.type, `item.${p.name}`, isEloquentResource)
                )
                .join('\n');
            return `  ${camelProp}: ${jsonPath}?.map(item => ({\n${indent(itemFieldLines)}\n  })),`;
        }
    }

    return `  ${camelProp}: ${jsonPath},`;
}
