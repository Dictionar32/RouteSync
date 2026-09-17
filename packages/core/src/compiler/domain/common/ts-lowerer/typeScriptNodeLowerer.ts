/**
 * typeScriptNodeLowerer.ts
 *
 * Lowering functions for converting ResolvedSemanticType nodes into TypeScript type expressions.
 *
 * @module compiler/domain/common/ts-lowerer/typeScriptNodeLowerer
 */

import type { ResolvedSemanticType, ResolvedObjectType } from '../ResolvedSemanticType';
import { TypeScriptLowererOptions } from './typeScriptVocabulary';

export const TS_PRIMITIVES: Record<string, string> = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    datetime: 'string',
    file: 'File',
    unknown: 'unknown'
};

export function lowerTypeScriptNode(
    resolved: ResolvedSemanticType,
    singleLine: boolean,
    indentLevel: number
): string {
    switch (resolved.kind) {
        case 'primitive':
            return TS_PRIMITIVES[resolved.primitiveKind] ?? 'string';

        case 'reference':
            return resolved.name;

        case 'optional':
            return `${lowerTypeScriptNode(resolved.innerType, singleLine, indentLevel)} | undefined`;

        case 'nullable':
            return `${lowerTypeScriptNode(resolved.innerType, singleLine, indentLevel)} | null`;

        case 'collection': {
            const inner = lowerTypeScriptNode(resolved.elementType, singleLine, indentLevel);
            return inner.includes(' | ') ? `(${inner})[]` : `${inner}[]`;
        }

        case 'object': {
            if (resolved.fields.length === 0) return 'object';
            const properties = resolved.fields.map(({ name, type, presence }) => {
                const propertyName = presence === 'optional' ? `${name}?` : name;
                return `${propertyName}: ${lowerTypeScriptNode(type, singleLine, indentLevel)};`;
            });
            return `{ ${properties.join(' ')} }`;
        }

        case 'union':
            return resolved.members
                .map(m => lowerTypeScriptNode(m, singleLine, indentLevel))
                .join(' | ');

        case 'intersection':
            return resolved.members
                .map(m => lowerTypeScriptNode(m, singleLine, indentLevel))
                .join(' & ');

        case 'unknown':
        default:
            return 'unknown';
    }
}

export function toTypeScriptTypeExpression(
    resolved: ResolvedSemanticType,
    { singleLine = false, indentLevel = 0 }: TypeScriptLowererOptions = {}
): string {
    return lowerTypeScriptNode(resolved, singleLine, indentLevel);
}

export function buildTopLevelDeclaration(name: string, resolvedObj: ResolvedObjectType): string {
    const properties = resolvedObj.fields
        .map(({ name: propName, type: propType, presence }) => {
            const propertyName = presence === 'optional' ? `${propName}?` : propName;
            return `  ${propertyName}: ${lowerTypeScriptNode(propType, true, 1)};`;
        })
        .join('\n');
    return `export interface ${name} {\n${properties}\n}`;
}
