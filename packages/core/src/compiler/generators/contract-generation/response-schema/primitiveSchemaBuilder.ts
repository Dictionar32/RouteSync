/**
 * primitiveSchemaBuilder.ts
 *
 * Primitive schema mapping and field modifiers helper.
 *
 * @module core/compiler/generators/contract-generation/response-schema/primitiveSchemaBuilder
 */

import type { ParsedResponseField } from '../ResponseFieldParser';

const ZOD_TYPE_MAP: Record<string, string> = {
    'string': 'z.string()',
    'number': 'z.number()',
    'boolean': 'z.boolean()',
    'datetime': 'z.string().datetime()',
    'unknown': 'z.unknown()'
};

export function buildPrimitiveSchema(type: string): string {
    return ZOD_TYPE_MAP[type] || 'z.unknown()';
}

export function buildModifiers(field: ParsedResponseField): string {
    let modifiers = '';

    if (field.nullable) {
        modifiers += '.nullable()';
    }

    if (field.optional) {
        modifiers += '.optional()';
    }

    return modifiers;
}

export function buildPrimitiveSchemaWithModifiers(field: ParsedResponseField): string {
    const baseSchema = buildPrimitiveSchema(field.type);
    const modifiers = buildModifiers(field);
    return modifiers ? `${baseSchema}${modifiers}` : baseSchema;
}

export function toCamelCase(str: string): string {
    return str
        .split(/[-_]/)
        .map((word, index) =>
            index === 0
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('');
}
