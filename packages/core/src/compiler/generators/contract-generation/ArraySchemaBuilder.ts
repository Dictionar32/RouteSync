/**
 * ArraySchemaBuilder - Build z.array() schemas with recursive item types
 * 
 * Part of Response Contract Generation (Step 4 - Layer 2)
 * 
 * Responsibilities:
 * - Build z.array() schemas for arrays
 * - Handle arrays of primitives
 * - Handle arrays of objects (delegate to NestedObjectSchemaBuilder)
 * - Handle nested arrays (arrays of arrays)
 * - Apply nullable/optional modifiers
 * 
 * SOC: Only array schema building
 * SOT: Uses NestedObjectSchemaBuilder for object items
 */

import { NestedObjectSchemaBuilder } from './NestedObjectSchemaBuilder'
import { ZodModifierBuilder } from './ZodModifierBuilder'
import type { ParsedResponseField } from './ResponseFieldParser'

/**
 * Builder for z.array() schemas with recursive item support
 */
export class ArraySchemaBuilder {
    constructor(
        private nestedObjectBuilder: NestedObjectSchemaBuilder,
        private zodModifierBuilder: ZodModifierBuilder
    ) { }

    /**
     * Build z.array() schema with proper item type
     * 
     * @param field - Parsed field with kind='array'
     * @returns Complete z.array() schema string
     */
    buildArraySchema(field: ParsedResponseField): string {
        // Validate this is an array field
        if (field.kind !== 'array') {
            throw new Error(`ArraySchemaBuilder expects kind='array', got '${field.kind}'`)
        }

        // Validate itemType exists
        if (!field.itemType) {
            throw new Error(`Array field '${field.name}' missing itemType`)
        }

        // Build item schema based on item kind
        const itemSchema = this.buildItemSchema(field.itemType)

        // Wrap in z.array()
        const baseSchema = `z.array(${itemSchema})`

        // Apply modifiers to the array itself
        return this.applyModifiers(baseSchema, field)
    }

    /**
     * Build schema for array item type
     * 
     * Delegates to appropriate builder based on item kind
     */
    private buildItemSchema(itemType: ParsedResponseField): string {
        switch (itemType.kind) {
            case 'primitive':
                return this.buildPrimitiveItemSchema(itemType)

            case 'object':
                // Delegate to NestedObjectSchemaBuilder with inline format
                return this.nestedObjectBuilder.buildObjectSchema(itemType, true)

            case 'array':
                // Recursive: array of arrays
                return this.buildArraySchema(itemType)

            default:
                throw new Error(`Unsupported array item kind: ${itemType.kind}`)
        }
    }

    /**
     * Build schema for primitive array items
     */
    private buildPrimitiveItemSchema(itemType: ParsedResponseField): string {
        // Map primitive types to Zod schemas
        const zodTypeMap: Record<string, string> = {
            'string': 'z.string()',
            'number': 'z.number()',
            'boolean': 'z.boolean()',
            'datetime': 'z.string().datetime()',
            'unknown': 'z.unknown()'
        }

        const baseSchema = zodTypeMap[itemType.type] || 'z.unknown()'

        // Apply modifiers to item (not the array)
        const modifiers = this.zodModifierBuilder.buildModifiers({
            required: !itemType.optional,
            nullable: itemType.nullable
        })

        return baseSchema + modifiers
    }

    /**
     * Apply nullable/optional modifiers to array schema
     */
    private applyModifiers(
        schema: string,
        field: ParsedResponseField
    ): string {
        const modifiers = this.zodModifierBuilder.buildModifiers({
            required: !field.optional,
            nullable: field.nullable
        })

        return schema + modifiers
    }
}
