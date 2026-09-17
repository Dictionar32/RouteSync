/**
 * formFieldLineBuilder.ts
 *
 * Form field mapping line generator using ApiApiField bracket notation.
 *
 * @module compiler/passes/mapper/formFieldLineBuilder
 */

import { toCamelCase } from '../../../utils/resource-naming';
import {
    ReadonlyCollectionType,
    MutableCollectionType
} from '../../types/SemanticType';
import type { RequestField } from '../../types/domain/request';
import { indent } from './readMapperBuilder';
import { toApiFieldKey } from './formMapperBuilder';

export function extractObjectPropertyNames(target: unknown): readonly string[] {
    if (!target || typeof target !== 'object') return [];
    const props = (target as { properties?: unknown }).properties;
    if (Array.isArray(props)) {
        return props
            .map(p => (p && typeof p === 'object' && 'name' in p ? String(p.name) : ''))
            .filter(name => name.length > 0 && !name.startsWith('__'));
    }
    if (props && typeof (props as Map<string, unknown>).keys === 'function') {
        return Array.from((props as Map<string, unknown>).keys())
            .filter(key => typeof key === 'string' && !key.startsWith('__'));
    }
    return [];
}

export function getCollectionElementType(type: unknown): unknown {
    if (type instanceof ReadonlyCollectionType || type instanceof MutableCollectionType) {
        return type.elementType;
    }
    if (type && typeof type === 'object' && 'kind' in type) {
        const kind = (type as { kind?: string }).kind;
        if (kind === 'readonly_collection' || kind === 'mutable_collection') {
            return (type as { elementType?: unknown }).elementType;
        }
    }
    return null;
}

/**
 * Builds a single form field mapping line using ApiApiField indexing.
 */
export function buildFormFieldLine(field: RequestField): string {
    const key = toApiFieldKey(field.sourceName);
    const propName = field.name;

    const collectionElem = getCollectionElementType(field.type);
    if (collectionElem) {
        const cleanProps = extractObjectPropertyNames(collectionElem);
        if (cleanProps.length > 0) {
            const innerLines = cleanProps
                .map(k => `  [ApiApiField.${toApiFieldKey(k)}]: item.${toCamelCase(k)}`)
                .join(',\n');
            return `  [ApiApiField.${key}]: form.${propName}?.map(item => ({\n${indent(innerLines)}\n  })),`;
        }
    }

    const objectProps = extractObjectPropertyNames(field.type);
    if (objectProps.length > 0) {
        const innerLines = objectProps
            .map(k => `  [ApiApiField.${toApiFieldKey(k)}]: form.${propName}?.${toCamelCase(k)}`)
            .join(',\n');
        return `  [ApiApiField.${key}]: form.${propName} ? {\n${indent(innerLines)}\n  } : undefined,`;
    }

    return `  [ApiApiField.${key}]: form.${propName},`;
}
