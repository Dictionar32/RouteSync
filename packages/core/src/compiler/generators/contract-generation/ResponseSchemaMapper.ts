/**
 * ResponseSchemaMapper - Map route responses to Zod schemas
 * 
 * Part of Response Contract Generation (Step 5 - Integration Layer)
 * 
 * Responsibilities:
 * - Map complete route to response schemas
 * - Handle index (list) and show (single) actions
 * - Integrate all response schema builders
 * - Generate final Zod schema code
 * 
 * SOC: Only schema mapping, no code building
 * SOT: ResponseStructureBuilder is source for parsed structure
 */

import { ResponseFieldParser, type ParsedResponseField } from './ResponseFieldParser'
import { ResponseStructureBuilder } from './ResponseStructureBuilder'
import { NestedObjectSchemaBuilder } from './NestedObjectSchemaBuilder'
import { ArraySchemaBuilder } from './ArraySchemaBuilder'
import { ZodModifierBuilder } from './ZodModifierBuilder'

/**
 * Response type information from manifest
 * Contains full response structure with fields array
 */
export interface ResponseTypeInfo {
    /** Type name (e.g., 'User', 'Order') */
    type: string

    /** Whether this is a collection response */
    collection: boolean

    /** Array of response fields with parsed structure */
    fields: Array<{
        name: string
        kind: 'primitive' | 'object' | 'array'
        type?: string
        fields?: Array<ParsedResponseField>
        itemType?: string
        nullable?: boolean
        optional?: boolean
    }>
}

/**
 * Route action type
 */
export type RouteAction = 'index' | 'show' | 'store' | 'update' | 'destroy'

/**
 * Response schema for a route action
 */
export interface ActionResponseSchema {
    action: RouteAction
    schemaName: string
    zodSchema: string
    isArray: boolean
}

/**
 * Complete response schemas for a resource
 */
export interface ResourceResponseSchemas {
    resourceName: string
    schemas: ActionResponseSchema[]
}

/**
 * Maps route responses to Zod schemas
 */
export class ResponseSchemaMapper {
    private responseFieldParser: ResponseFieldParser
    private responseStructureBuilder: ResponseStructureBuilder
    private nestedObjectBuilder: NestedObjectSchemaBuilder
    private arraySchemaBuilder: ArraySchemaBuilder

    constructor() {
        const zodModifierBuilder = new ZodModifierBuilder()

        this.responseFieldParser = new ResponseFieldParser()
        this.responseStructureBuilder = new ResponseStructureBuilder(this.responseFieldParser)
        this.nestedObjectBuilder = new NestedObjectSchemaBuilder(zodModifierBuilder)
        this.arraySchemaBuilder = new ArraySchemaBuilder(this.nestedObjectBuilder, zodModifierBuilder)
    }

    /**
     * Simple adapter method for ResponseActionBuilder
     * 
     * Converts ParsedResponseField[] to Zod schema directly.
     * This is a convenience method that wraps mapActionResponse() with simpler inputs.
     * 
     * @param fields - Array of parsed response fields
     * @param resourceName - Resource name (e.g., 'checkout')
     * @param action - Action type ('show' or 'index')
     * @returns Zod schema string
     * 
     * @example
     * ```typescript
     * const fields = [
     *   { name: 'id', type: 'primitive', primitiveType: 'number', optional: false },
     *   { name: 'name', type: 'primitive', primitiveType: 'string', optional: false }
     * ];
     * 
     * const schema = mapper.mapFieldsToZod(fields, 'user', 'show');
     * // Returns: "z.object({\n  id: z.number(),\n  name: z.string()\n})"
     * ```
     */
    mapFieldsToZod(
        fields: ReadonlyArray<ParsedResponseField>,
        resourceName: string,
        action: 'show' | 'index'
    ): string {
        // Build Zod schema from fields directly
        let zodSchema: string

        if (fields.length === 0) {
            // Empty object case
            zodSchema = 'z.object({})'
        } else {
            // Build z.object() from fields
            zodSchema = this.buildObjectFromFields(fields as ParsedResponseField[])
        }

        // For index actions, wrap in array
        if (action === 'index') {
            zodSchema = `z.array(${zodSchema})`
        }

        return zodSchema
    }

    /**
     * Map single route response to Zod schema
     * 
     * @param action Route action (index, show, etc)
     * @param responseType Response type info from manifest
     * @param resourceName Resource name (e.g., 'checkout', 'product')
     * @returns Action response schema
     */
    mapActionResponse(
        action: RouteAction,
        responseType: ResponseTypeInfo,
        resourceName: string
    ): ActionResponseSchema {
        // Response fields are already in ParsedResponseField format
        const fields = responseType.fields as ParsedResponseField[]

        // Determine if response is array (for index actions)
        const isArray = action === 'index' || responseType.collection

        // Build Zod schema from fields directly
        let zodSchema: string

        if (fields.length === 0) {
            // Empty object case
            zodSchema = 'z.object({})'
        } else {
            // Build z.object() from fields
            zodSchema = this.buildObjectFromFields(fields)
        }

        // For index actions or collections, wrap in array
        if (isArray) {
            zodSchema = `z.array(${zodSchema})`
        }

        // Generate schema name
        const schemaName = this.generateSchemaName(resourceName, action)

        return {
            action,
            schemaName,
            zodSchema,
            isArray
        }
    }

    /**
     * Map all actions for a resource
     * 
     * @param resourceName Resource name
     * @param actions Map of action → response type
     * @returns Complete resource schemas
     */
    mapResourceResponses(
        resourceName: string,
        actions: Record<RouteAction, ResponseTypeInfo | null>
    ): ResourceResponseSchemas {
        const schemas: ActionResponseSchema[] = []

        for (const [action, responseType] of Object.entries(actions)) {
            if (responseType) {
                const schema = this.mapActionResponse(
                    action as RouteAction,
                    responseType,
                    resourceName
                )
                schemas.push(schema)
            }
        }

        return {
            resourceName,
            schemas
        }
    }

    /**
     * Build z.object() schema from fields array
     * 
     * Calls NestedObjectSchemaBuilder for each field
     */
    private buildObjectFromFields(fields: ParsedResponseField[]): string {
        const properties = fields.map(field => {
            const fieldSchema = this.buildFieldSchema(field)
            return `${field.name}: ${fieldSchema}`
        })

        return `z.object({\n  ${properties.join(',\n  ')}\n})`
    }

    /**
     * Build schema for any field type (primitive, object, array)
     */
    private buildFieldSchema(field: ParsedResponseField): string {
        switch (field.kind) {
            case 'primitive':
                return this.buildPrimitiveSchemaWithModifiers(field)

            case 'object':
                // Use NestedObjectSchemaBuilder for nested objects
                return this.nestedObjectBuilder.buildObjectSchema(field)

            case 'array':
                // Use ArraySchemaBuilder for arrays
                return this.arraySchemaBuilder.buildArraySchema(field)

            default:
                throw new Error(`Unknown field kind: ${(field).kind}`)
        }
    }

    /**
     * Build primitive schema with modifiers
     */
    private buildPrimitiveSchemaWithModifiers(field: ParsedResponseField): string {
        const baseSchema = this.buildPrimitiveSchema(field.type)
        const modifiers = this.buildModifiers(field)
        return modifiers ? `${baseSchema}${modifiers}` : baseSchema
    }

    /**
     * Build modifiers for field
     */
    private buildModifiers(field: ParsedResponseField): string {
        let modifiers = ''

        if (field.nullable) {
            modifiers += '.nullable()'
        }

        if (field.optional) {
            modifiers += '.optional()'
        }

        return modifiers
    }

    /**
     * Generate schema constant name
     * 
     * Example: checkout + index → checkoutIndexSchema
     */
    private generateSchemaName(resourceName: string, action: RouteAction): string {
        // Convert to camelCase
        const baseName = this.toCamelCase(resourceName)
        const actionName = action.charAt(0).toUpperCase() + action.slice(1)

        return `${baseName}${actionName}Schema`
    }

    /**
     * Build primitive type schema
     */
    private buildPrimitiveSchema(type: string): string {
        const zodTypeMap: Record<string, string> = {
            'string': 'z.string()',
            'number': 'z.number()',
            'boolean': 'z.boolean()',
            'datetime': 'z.string().datetime()',
            'unknown': 'z.unknown()'
        }

        return zodTypeMap[type] || 'z.unknown()'
    }

    /**
     * Convert string to camelCase
     */
    private toCamelCase(str: string): string {
        return str
            .split(/[-_]/)
            .map((word, index) =>
                index === 0
                    ? word.toLowerCase()
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join('')
    }
}
