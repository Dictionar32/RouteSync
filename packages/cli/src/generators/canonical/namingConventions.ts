/**
 * namingConventions.ts
 *
 * Special naming conventions and patterns used across generators.
 *
 * @module cli/generators/canonical/namingConventions
 */

export const NAMING_CONVENTIONS = {
    // Zod schema suffix
    schemaNameSuffix: 'Schema',

    // Type validation function prefix
    validateFunctionPrefix: 'validate',

    // Mapper function prefix (response read transformation)
    readMapperPrefix: 'to',
    readMapperSuffix: 'Read',

    // Mapper function prefix (form input transformation)
    formMapperPrefix: 'toApi',

    // Type transformation suffix (untuk api-read.ts interface)
    transformedTypeSuffix: 'Transformed',

    // Form type name pattern (untuk api-form.ts)
    formTypePattern: 'Form',

    // Query key pattern
    queryKeyFunctionName: 'QueryKey',
} as const;

export function wrapNullableTs(typeStr: string, nullable: boolean): string {
    if (!nullable) return typeStr;
    return `(${typeStr}) | null`;
}

export function wrapNullableZod(schemaStr: string, nullable: boolean): string {
    if (!nullable) return schemaStr;
    if (!schemaStr.startsWith('z.')) return schemaStr;
    return `${schemaStr}.nullable()`;
}
