/**
 * Response Action Builder
 * 
 * Builds response action schemas (index/show) for contract generation.
 * 
 * Responsibilities:
 * - Build show action schema (single resource)
 * - Build index action schema (resource array)
 * - Delegate field schema generation to ResponseSchemaMapper
 * 
 * Architecture:
 * - SOC: Only action schema building, no field parsing
 * - SOT: Uses ResponseSchemaMapper for field schemas
 * - Small: < 150 lines
 * 
 * @module compiler/generators/contract-generation
 */

import type { ResponseSchemaMapper } from './ResponseSchemaMapper';
import type { ParsedResponseField } from './ResponseFieldParser';
import { toPascalCase } from '../../../utils/resource-naming';

/**
 * Generated action response schema
 */
export interface ActionResponseSchema {
    /** Schema name (e.g., 'checkoutShowSchema') */
    readonly schemaName: string;

    /** Zod schema code */
    readonly zodSchema: string;

    /** Action type */
    readonly action: 'show' | 'index';

    /** Resource name */
    readonly resourceName: string;
}

/**
 * Response Action Builder
 * 
 * Follows ContractActionGenerator pattern but for responses.
 * 
 * Usage:
 * ```typescript
 * const builder = new ResponseActionBuilder(responseSchemaMapper);
 * 
 * // Build show schema (single resource)
 * const showSchema = builder.buildShowSchema('checkout', fields);
 * // → checkoutShowSchema = z.object({ ... })
 * 
 * // Build index schema (array of resources)
 * const indexSchema = builder.buildIndexSchema('checkout', fields);
 * // → checkoutIndexSchema = z.array(z.object({ ... }))
 * ```
 */
export class ResponseActionBuilder {
    constructor(
        private readonly responseSchemaMapper: ResponseSchemaMapper
    ) { }

    /**
     * Build show action schema (single resource)
     * 
     * Generates:
     * ```typescript
     * export const checkoutShowSchema = z.object({
     *   id: z.number(),
     *   items: z.array(z.object({ ... })),
     *   // ... other fields
     * });
     * ```
     * 
     * @param resourceName - Resource name (e.g., 'checkout')
     * @param responseFields - Parsed response fields
     * @returns Action response schema
     */
    buildShowSchema(
        resourceName: string,
        responseFields: ReadonlyArray<ParsedResponseField>
    ): ActionResponseSchema {
        // Generate schema name: resourceShowSchema
        const schemaName = this.generateSchemaName(resourceName, 'show');

        // Build schema using ResponseSchemaMapper's simple adapter method
        const zodSchema = this.responseSchemaMapper.mapFieldsToZod(
            responseFields,
            resourceName,
            'show'
        );

        return {
            schemaName,
            zodSchema,
            action: 'show',
            resourceName
        };
    }

    /**
     * Build index action schema (resource collection)
     * 
     * Generates:
     * ```typescript
     * export const checkoutIndexSchema = z.array(checkoutShowSchema);
     * ```
     * 
     * @param resourceName - Resource name (e.g., 'checkout')
     * @param showSchemaName - Show schema name to reference
     * @returns Action response schema (wrapped in z.array())
     */
    buildIndexSchema(
        resourceName: string,
        showSchemaName: string
    ): ActionResponseSchema {
        // Generate schema name: resourceIndexSchema
        const schemaName = this.generateSchemaName(resourceName, 'index');

        // Reference show schema instead of duplicating
        const zodSchema = `z.array(${showSchemaName})`;

        return {
            schemaName,
            zodSchema,
            action: 'index',
            resourceName
        };
    }

    /**
     * Generate schema name
     * 
     * Pattern: {resourceName}{Action}Schema
     * - checkout + show → checkoutShowSchema
     * - checkout + index → checkoutIndexSchema
     * 
     * @param resourceName - Resource name
     * @param action - Action type
     * @returns Schema name
     */
    private generateSchemaName(
        resourceName: string,
        action: 'show' | 'index'
    ): string {
        // Ensure camelCase resource name
        const camelResourceName = resourceName.charAt(0).toLowerCase() +
            toPascalCase(resourceName).slice(1);

        // Capitalize action
        const capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);

        return `${camelResourceName}${capitalizedAction}Schema`;
    }
}
