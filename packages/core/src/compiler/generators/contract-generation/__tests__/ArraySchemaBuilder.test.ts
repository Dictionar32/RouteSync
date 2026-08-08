/**
 * Tests for ArraySchemaBuilder
 * 
 * Tests z.array() schema building with recursive item types
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { ArraySchemaBuilder } from '../ArraySchemaBuilder'
import { NestedObjectSchemaBuilder } from '../NestedObjectSchemaBuilder'
import { ZodModifierBuilder } from '../ZodModifierBuilder'
import type { ParsedResponseField } from '../ResponseFieldParser'

describe('ArraySchemaBuilder', () => {
    let builder: ArraySchemaBuilder
    let nestedObjectBuilder: NestedObjectSchemaBuilder
    let zodModifierBuilder: ZodModifierBuilder

    beforeEach(() => {
        zodModifierBuilder = new ZodModifierBuilder()
        nestedObjectBuilder = new NestedObjectSchemaBuilder(zodModifierBuilder)
        builder = new ArraySchemaBuilder(nestedObjectBuilder, zodModifierBuilder)
    })

    // ===== ARRAYS OF PRIMITIVES =====

    test('should build array of strings', () => {
        const field: ParsedResponseField = {
            name: 'tags',
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: false,
            itemType: {
                name: 'tag',
                kind: 'primitive',
                type: 'string',
                nullable: false,
                optional: false
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.string())')
    })

    test('should build array of numbers', () => {
        const field: ParsedResponseField = {
            name: 'scores',
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: false,
            itemType: {
                name: 'score',
                kind: 'primitive',
                type: 'number',
                nullable: false,
                optional: false
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.number())')
    })

    test('should build array of booleans', () => {
        const field: ParsedResponseField = {
            name: 'flags',
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: false,
            itemType: {
                name: 'flag',
                kind: 'primitive',
                type: 'boolean',
                nullable: false,
                optional: false
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.boolean())')
    })

    // ===== ARRAYS WITH NULLABLE/OPTIONAL ITEMS =====

    test('should handle nullable items in array', () => {
        const field: ParsedResponseField = {
            name: 'tags',
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: false,
            itemType: {
                name: 'tag',
                kind: 'primitive',
                type: 'string',
                nullable: true, // Item is nullable
                optional: false
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.string().nullable())')
    })

    test('should handle optional items in array', () => {
        const field: ParsedResponseField = {
            name: 'tags',
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: false,
            itemType: {
                name: 'tag',
                kind: 'primitive',
                type: 'string',
                nullable: false,
                optional: true // Item is optional
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.string().optional())')
    })

    // ===== ARRAY MODIFIERS =====

    test('should apply nullable modifier to array', () => {
        const field: ParsedResponseField = {
            name: 'tags',
            kind: 'array',
            type: 'array',
            nullable: true, // Array itself is nullable
            optional: false,
            itemType: {
                name: 'tag',
                kind: 'primitive',
                type: 'string',
                nullable: false,
                optional: false
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.string()).nullable()')
    })

    test('should apply optional modifier to array', () => {
        const field: ParsedResponseField = {
            name: 'tags',
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: true, // Array itself is optional
            itemType: {
                name: 'tag',
                kind: 'primitive',
                type: 'string',
                nullable: false,
                optional: false
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.string()).optional()')
    })

    test('should apply both nullable and optional to array', () => {
        const field: ParsedResponseField = {
            name: 'tags',
            kind: 'array',
            type: 'array',
            nullable: true,
            optional: true,
            itemType: {
                name: 'tag',
                kind: 'primitive',
                type: 'string',
                nullable: false,
                optional: false
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.string()).nullable().optional()')
    })

    // ===== ARRAYS OF OBJECTS =====

    test('should build array of simple objects', () => {
        const field: ParsedResponseField = {
            name: 'users',
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: false,
            itemType: {
                name: 'user',
                kind: 'object',
                type: 'object',
                nullable: false,
                optional: false,
                fields: [
                    {
                        name: 'id',
                        kind: 'primitive',
                        type: 'number',
                        nullable: false,
                        optional: false
                    },
                    {
                        name: 'name',
                        kind: 'primitive',
                        type: 'string',
                        nullable: false,
                        optional: false
                    }
                ]
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.object({ id: z.number(), name: z.string() }))')
    })

    test('should build array of nested objects', () => {
        const field: ParsedResponseField = {
            name: 'orders',
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: false,
            itemType: {
                name: 'order',
                kind: 'object',
                type: 'object',
                nullable: false,
                optional: false,
                fields: [
                    {
                        name: 'id',
                        kind: 'primitive',
                        type: 'number',
                        nullable: false,
                        optional: false
                    },
                    {
                        name: 'shipping',
                        kind: 'object',
                        type: 'object',
                        nullable: false,
                        optional: false,
                        fields: [
                            {
                                name: 'address',
                                kind: 'primitive',
                                type: 'string',
                                nullable: false,
                                optional: false
                            }
                        ]
                    }
                ]
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.object({ id: z.number(), shipping: z.object({ address: z.string() }) }))')
    })

    // ===== NESTED ARRAYS =====

    test('should build array of arrays (2D array)', () => {
        const field: ParsedResponseField = {
            name: 'matrix',
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: false,
            itemType: {
                name: 'row',
                kind: 'array',
                type: 'array',
                nullable: false,
                optional: false,
                itemType: {
                    name: 'cell',
                    kind: 'primitive',
                    type: 'number',
                    nullable: false,
                    optional: false
                }
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.array(z.number()))')
    })

    test('should build 3D array', () => {
        const field: ParsedResponseField = {
            name: 'cube',
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: false,
            itemType: {
                name: 'layer',
                kind: 'array',
                type: 'array',
                nullable: false,
                optional: false,
                itemType: {
                    name: 'row',
                    kind: 'array',
                    type: 'array',
                    nullable: false,
                    optional: false,
                    itemType: {
                        name: 'cell',
                        kind: 'primitive',
                        type: 'number',
                        nullable: false,
                        optional: false
                    }
                }
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.array(z.array(z.number())))')
    })

    // ===== ERROR HANDLING =====

    test('should throw error for non-array field', () => {
        const field: ParsedResponseField = {
            name: 'name',
            kind: 'primitive',
            type: 'string',
            nullable: false,
            optional: false
        }

        expect(() => builder.buildArraySchema(field))
            .toThrow("ArraySchemaBuilder expects kind='array', got 'primitive'")
    })

    test('should throw error for array without itemType', () => {
        const field: ParsedResponseField = {
            name: 'tags',
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: false
            // Missing itemType
        }

        expect(() => builder.buildArraySchema(field))
            .toThrow("Array field 'tags' missing itemType")
    })

    // ===== REAL-WORLD EXAMPLES =====

    test('should build e-commerce product variants array', () => {
        const field: ParsedResponseField = {
            name: 'variants',
            kind: 'array',
            type: 'array',
            nullable: false,
            optional: false,
            itemType: {
                name: 'variant',
                kind: 'object',
                type: 'object',
                nullable: false,
                optional: false,
                fields: [
                    {
                        name: 'id',
                        kind: 'primitive',
                        type: 'number',
                        nullable: false,
                        optional: false
                    },
                    {
                        name: 'name',
                        kind: 'primitive',
                        type: 'string',
                        nullable: false,
                        optional: false
                    },
                    {
                        name: 'price',
                        kind: 'primitive',
                        type: 'number',
                        nullable: false,
                        optional: false
                    },
                    {
                        name: 'stock',
                        kind: 'primitive',
                        type: 'number',
                        nullable: true,
                        optional: false
                    }
                ]
            }
        }

        const result = builder.buildArraySchema(field)

        expect(result).toBe('z.array(z.object({ id: z.number(), name: z.string(), price: z.number(), stock: z.number().nullable() }))')
    })
})
