/**
 * readFieldLineBuilder.ts
 *
 * Line generator for read mappers: API response -> camelCase frontend model.
 *
 * @module compiler/passes/mapper/readFieldLineBuilder
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

function stripTransformedSuffix(name: string): string {
    return name.endsWith('Transformed') ? name.slice(0, -11) : name;
}

export function resolveResourceBaseName(elem: unknown): string | null {
    if (elem instanceof ReferenceType && elem.name.includes('Resource')) {
        return toPascalCase(stripTransformedSuffix(elem.name));
    }
    if (elem instanceof ObjectType && elem.role === 'resource') {
        return toPascalCase(stripTransformedSuffix(elem.name));
    }
    return null;
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
        const elemResourceName = resolveResourceBaseName(elem);
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
