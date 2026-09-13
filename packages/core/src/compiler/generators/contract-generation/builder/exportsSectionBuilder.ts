/**
 * exportsSectionBuilder.ts
 *
 * Builder for centralized ContractSchemas export object.
 *
 * @module compiler/generators/contract-generation/builder/exportsSectionBuilder
 */

import { GeneratedContract, ResponseSchema, capitalize } from './contractBuilderTypes';

/**
 * Build Section 4: Exports
 */
export function buildExportsSection(
    lines: string[],
    contracts: readonly GeneratedContract[],
    responseSchemas: readonly ResponseSchema[] = []
): void {
    lines.push('export const ContractSchemas = {');

    // Export request schemas
    contracts.forEach((contract, index) => {
        const comma = (index < contracts.length - 1 || responseSchemas.length > 0) ? ',' : '';
        lines.push(`  ${contract.resourceName}: ${contract.resourceName}ContractSchema${comma}`);
    });

    // Export response schemas (grouped by resource)
    if (responseSchemas.length > 0) {
        const byResource = new Map<string, ResponseSchema[]>();

        for (const schema of responseSchemas) {
            const existing = byResource.get(schema.resourceName) ?? [];
            existing.push(schema);
            byResource.set(schema.resourceName, existing);
        }

        const resources = Array.from(byResource.keys());
        resources.forEach((resourceName, index) => {
            const schemas = byResource.get(resourceName)!;
            const showSchema = schemas.find(s => s.action === 'show');
            const indexSchema = schemas.find(s => s.action === 'index');

            const comma = index < resources.length - 1 ? ',' : '';
            const pascalResource = capitalize(resourceName);

            if (showSchema && indexSchema) {
                lines.push(`  ${pascalResource}Response: { Schema: ${showSchema.schemaName}, IndexSchema: ${indexSchema.schemaName} }${comma}`);
            } else if (showSchema) {
                lines.push(`  ${pascalResource}Response: { Schema: ${showSchema.schemaName} }${comma}`);
            } else if (indexSchema) {
                lines.push(`  ${pascalResource}Response: { IndexSchema: ${indexSchema.schemaName} }${comma}`);
            }
        });
    }

    lines.push('};');
}
