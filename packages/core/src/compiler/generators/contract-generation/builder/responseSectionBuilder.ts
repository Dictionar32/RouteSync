/**
 * responseSectionBuilder.ts
 *
 * Builders for response schemas, types, and validators (show/index actions).
 *
 * @module compiler/generators/contract-generation/builder/responseSectionBuilder
 */

import { ResponseSchema, capitalize } from './contractBuilderTypes';

/**
 * Build Response Schemas Section (show/index at top of file)
 * 
 * Generates schemas like:
 * ```typescript
 * export const orderShowSchema = z.object({ id: z.number(), ... });
 * export const orderIndexSchema = z.array(orderShowSchema);
 * ```
 */
export function buildResponseSchemasSection(
    lines: string[],
    responseSchemas: readonly ResponseSchema[]
): void {
    const byResource = new Map<string, ResponseSchema[]>();

    for (const schema of responseSchemas) {
        const existing = byResource.get(schema.resourceName) ?? [];
        existing.push(schema);
        byResource.set(schema.resourceName, existing);
    }

    for (const [resourceName, schemas] of byResource.entries()) {
        const showSchema = schemas.find(s => s.action === 'show');
        const indexSchema = schemas.find(s => s.action === 'index');

        if (showSchema) {
            lines.push(`/**`);
            lines.push(` * @provenance JsonResponse: ${resourceName}`);
            lines.push(` */`);
            lines.push(`export const ${showSchema.schemaName} = ${showSchema.zodSchema};`);
        }

        if (indexSchema && showSchema) {
            lines.push(`/**`);
            lines.push(` * @provenance JsonResponseIndex: ${resourceName}`);
            lines.push(` */`);
            lines.push(`export const ${indexSchema.schemaName} = z.array(${showSchema.schemaName});`);
        } else if (indexSchema && !showSchema) {
            lines.push(`/**`);
            lines.push(` * @provenance JsonResponseIndex: ${resourceName}`);
            lines.push(` */`);
            lines.push(`export const ${indexSchema.schemaName} = ${indexSchema.zodSchema};`);
        }

        lines.push('');
    }
}

/**
 * Build Response Types Section
 */
export function buildResponseTypesSection(
    lines: string[],
    responseSchemas: readonly ResponseSchema[]
): void {
    const byResource = new Map<string, ResponseSchema[]>();

    for (const schema of responseSchemas) {
        const existing = byResource.get(schema.resourceName) ?? [];
        existing.push(schema);
        byResource.set(schema.resourceName, existing);
    }

    for (const [resourceName, schemas] of byResource.entries()) {
        const showSchema = schemas.find(s => s.action === 'show');
        const indexSchema = schemas.find(s => s.action === 'index');

        const pascalResource = capitalize(resourceName);

        if (showSchema) {
            lines.push(
                `export type ${pascalResource}ApiResponse = z.infer<typeof ${showSchema.schemaName}>;`
            );
        }

        if (indexSchema) {
            lines.push(
                `export type ${pascalResource}ApiIndex = z.infer<typeof ${indexSchema.schemaName}>;`
            );
        }
    }
}

/**
 * Build Response Validators Section
 */
export function buildResponseValidatorsSection(
    lines: string[],
    responseSchemas: readonly ResponseSchema[]
): void {
    const byResource = new Map<string, ResponseSchema[]>();

    for (const schema of responseSchemas) {
        const existing = byResource.get(schema.resourceName) ?? [];
        existing.push(schema);
        byResource.set(schema.resourceName, existing);
    }

    for (const [resourceName, schemas] of byResource.entries()) {
        const showSchema = schemas.find(s => s.action === 'show');
        const indexSchema = schemas.find(s => s.action === 'index');

        const pascalResource = capitalize(resourceName);

        if (showSchema) {
            lines.push(
                `export const validate${pascalResource}Schema = (payload: unknown): ${pascalResource}ApiResponse => ${showSchema.schemaName}.parse(payload);`
            );
        }

        if (indexSchema) {
            lines.push(
                `export const validate${pascalResource}Index = (payload: unknown): ${pascalResource}ApiIndex => ${indexSchema.schemaName}.parse(payload);`
            );
        }

        lines.push('');
    }
}
