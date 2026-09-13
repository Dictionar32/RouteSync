/**
 * formMapperBuilder.ts
 *
 * Generates form mappers: form values -> API payload (snake_case, via ApiApiField bracket notation).
 *
 * @module compiler/passes/mapper/formMapperBuilder
 */

import { toPascalCase, toCamelCase } from '../../../utils/resource-naming';
import {
    ObjectType,
    ReadonlyCollectionType,
    MutableCollectionType
} from '../../types/SemanticType';
import type { RequestType, RequestField } from '../../artifacts/RequestTypesArtifact';
import { indent } from './readMapperBuilder';

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

/**
 * Builds a single form field mapping line using ApiApiField indexing.
 */
export function buildFormFieldLine(field: RequestField): string {
    const key = toApiFieldKey(field.originalName);
    const propName = toCamelCase(field.originalName);

    const isCollection =
        field.type instanceof ReadonlyCollectionType ||
        field.type instanceof MutableCollectionType ||
        (field.type as any)?.kind === 'readonly_collection' ||
        (field.type as any)?.kind === 'mutable_collection';

    if (isCollection) {
        const elem = (field.type as any).elementType;
        const isObject = elem instanceof ObjectType || elem?.kind === 'object';
        if (isObject && elem?.properties) {
            let propNames: string[] = [];
            if (Array.isArray(elem.properties)) {
                propNames = elem.properties.map((p: any) => p.name);
            } else if (typeof elem.properties.entries === 'function') {
                propNames = Array.from(elem.properties.entries()).map(([k]: any) => k);
            }

            const cleanProps = propNames.filter(k => typeof k === 'string' && !k.startsWith('__'));
            if (cleanProps.length > 0) {
                const innerLines = cleanProps
                    .map(k => `  [ApiApiField.${toApiFieldKey(k)}]: item.${toCamelCase(k)}`)
                    .join(',\n');
                return `  [ApiApiField.${key}]: form.${propName}?.map(item => ({\n${indent(innerLines)}\n  })),`;
            }
        }
    }

    const isObject = field.type instanceof ObjectType || (field.type as any)?.kind === 'object';
    if (isObject && (field.type as any)?.properties) {
        const elem = field.type as any;
        let propNames: string[] = [];
        if (Array.isArray(elem.properties)) {
            propNames = elem.properties.map((p: any) => p.name);
        } else if (typeof elem.properties.entries === 'function') {
            propNames = Array.from(elem.properties.entries()).map(([k]: any) => k);
        }

        const cleanProps = propNames.filter(k => typeof k === 'string' && !k.startsWith('__'));
        if (cleanProps.length > 0) {
            const innerLines = cleanProps
                .map(k => `  [ApiApiField.${toApiFieldKey(k)}]: form.${propName}?.${toCamelCase(k)}`)
                .join(',\n');
            return `  [ApiApiField.${key}]: form.${propName} ? {\n${indent(innerLines)}\n  } : undefined,`;
        }
    }

    return `  [ApiApiField.${key}]: form.${propName},`;
}
