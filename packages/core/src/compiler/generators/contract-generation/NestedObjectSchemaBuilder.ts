/**
 * NestedObjectSchemaBuilder - Build recursive z.object() schemas
 * 
 * Part of Response Contract Generation (Step 3 - Layer 2)
 * 
 * Responsibilities:
 * - Build z.object() schemas for nested objects
 * - Handle recursive nesting (objects within objects)
 * - Apply nullable/optional modifiers
 * 
 * SOC: Only object schema building, no arrays
 * SOT: Uses ZodModifierBuilder for modifiers
 */

import { ZodModifierBuilder } from './ZodModifierBuilder'
import type { ParsedResponseField } from './ResponseFieldParser'

/**
 * Builder for nested z.object() schemas
 */
export class NestedObjectSchemaBuilder {
    constructor(
        private zodModifierBuilder: ZodModifierBuilder
    ) { }

    /**
     * Build z.object() schema recursively
     * 
     * @param field Parsed response field with kind: 'object'
     * @param inline If true, generate inline format for compact output
     * @returns Zod schema string
     */
    buildObjectSchema(field: ParsedResponseField, inline = false): string {
        if (field.kind !== 'object') {
            throw new Error(`Expected object field, got ${field.kind}`)
        }

        if (!field.fields || field.fields.length === 0) {
            // Empty object
            const baseSchema = 'z.object({})'
            return this.applyModifiers(baseSchema, field)
        }

        // Build properties for z.object({ ... })
        const properties = field.fields.map(childField => {
            const propertySchema = this.buildFieldSchema(childField, inline)
            return `${childField.name}: ${propertySchema}`
        })

        const baseSchema = inline
            ? `z.object({ ${properties.join(', ')} })`
            : `z.object({\n  ${properties.join(',\n  ')}\n})`

        return this.applyModifiers(baseSchema, field)
    }

    /**
     * Build schema for any field type (primitive, object, array)
     * 
     * @param field Field to build schema for
     * @param inline If true, generate inline format for compact output
     * @returns Zod schema string
     */
    private buildFieldSchema(field: ParsedResponseField, inline = false): string {
        switch (field.kind) {
            case 'primitive':
                return this.buildPrimitiveSchema(field)

            case 'object':
                return this.buildObjectSchema(field, inline) // Recursive call with inline flag

            case 'array':
                // Arrays will be handled by ArraySchemaBuilder in Step 4
                // For now, just build basic array schema
                return this.buildBasicArraySchema(field)

            default:
                throw new Error(`Unknown field kind: ${(field).kind}`)
        }
    }

    /**
     * Build primitive type schema
     */
    private buildPrimitiveSchema(field: ParsedResponseField): string {
        // Map string type to Zod schema
        const zodTypeMap: Record<string, string> = {
            'string': 'z.string()',
            'number': 'z.number()',
            'boolean': 'z.boolean()',
            'datetime': 'z.string().datetime()',
            'unknown': 'z.unknown()'
        }

        const zodType = zodTypeMap[field.type] || 'z.unknown()'
        return this.applyModifiers(zodType, field)
    }

    /**
     * Build basic array schema (will be enhanced in Step 4)
     */
    private buildBasicArraySchema(field: ParsedResponseField): string {
        if (!field.itemType) {
            // Unknown item type - use z.unknown()
            const baseSchema = 'z.array(z.unknown())'
            return this.applyModifiers(baseSchema, field)
        }

        const itemSchema = this.buildFieldSchema(field.itemType)
        const baseSchema = `z.array(${itemSchema})`

        return this.applyModifiers(baseSchema, field)
    }

    /**
     * Apply nullable/optional modifiers to schema
     */
    private applyModifiers(
        schema: string,
        field: ParsedResponseField
    ): string {
        const modifiers = this.zodModifierBuilder.buildModifiers({
            required: !field.optional, // Convert optional → required
            nullable: field.nullable
        })

        return schema + modifiers
    }
}
