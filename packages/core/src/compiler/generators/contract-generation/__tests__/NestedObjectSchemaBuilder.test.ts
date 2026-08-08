/**
 * Tests for NestedObjectSchemaBuilder
 * 
 * Tests recursive z.object() schema building
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { NestedObjectSchemaBuilder } from '../NestedObjectSchemaBuilder'
import { ZodModifierBuilder } from '../ZodModifierBuilder'
import type { ParsedResponseField } from '../ResponseFieldParser'

describe('NestedObjectSchemaBuilder', () => {
    let builder: NestedObjectSchemaBuilder
    let zodModifierBuilder: ZodModifierBuilder

    beforeEach(() => {
        zodModifierBuilder = new ZodModifierBuilder()
        builder = new NestedObjectSchemaBuilder(zodModifierBuilder)
    })

    // ===== SIMPLE OBJECTS =====

    test('should build simple object with one field', () => {
        const field: ParsedResponseField = {
            name: 'user',
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: false,
            fields: [
                {
                    name: 'name',
                    kind: 'primitive',
                    type: 'string',
                    nullable: false,
                    optional: false
                }
            ]
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('z.object({')
        expect(schema).toContain('name: z.string()')
        expect(schema).toContain('})')
    })

    test('should build simple object with multiple fields', () => {
        const field: ParsedResponseField = {
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
                },
                {
                    name: 'active',
                    kind: 'primitive',
                    type: 'boolean',
                    nullable: false,
                    optional: false
                }
            ]
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('id: z.number()')
        expect(schema).toContain('name: z.string()')
        expect(schema).toContain('active: z.boolean()')
    })

    test('should build empty object', () => {
        const field: ParsedResponseField = {
            name: 'empty',
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: false,
            fields: []
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toBe('z.object({})')
    })

    // ===== NULLABLE/OPTIONAL MODIFIERS =====

    test('should apply nullable modifier to object', () => {
        const field: ParsedResponseField = {
            name: 'user',
            kind: 'object',
            type: 'object',
            nullable: true,
            optional: false,
            fields: [
                { name: 'name', kind: 'primitive', type: 'string', nullable: false, optional: false }
            ]
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('.nullable()')
    })

    test('should apply optional modifier to object', () => {
        const field: ParsedResponseField = {
            name: 'user',
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: true,
            fields: [
                { name: 'name', kind: 'primitive', type: 'string', nullable: false, optional: false }
            ]
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('.optional()')
    })

    test('should apply both nullable and optional modifiers', () => {
        const field: ParsedResponseField = {
            name: 'user',
            kind: 'object',
            type: 'object',
            nullable: true,
            optional: true,
            fields: [
                { name: 'name', kind: 'primitive', type: 'string', nullable: false, optional: false }
            ]
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('.nullable()')
        expect(schema).toContain('.optional()')
    })

    test('should handle nullable fields inside object', () => {
        const field: ParsedResponseField = {
            name: 'user',
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: false,
            fields: [
                {
                    name: 'email',
                    kind: 'primitive',
                    type: 'string',
                    nullable: true,
                    optional: false
                }
            ]
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('email: z.string().nullable()')
    })

    test('should handle optional fields inside object', () => {
        const field: ParsedResponseField = {
            name: 'user',
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: false,
            fields: [
                {
                    name: 'age',
                    kind: 'primitive',
                    type: 'number',
                    nullable: false,
                    optional: true
                }
            ]
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('age: z.number().optional()')
    })

    // ===== NESTED OBJECTS =====

    test('should build nested object (2 levels)', () => {
        const field: ParsedResponseField = {
            name: 'order',
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: false,
            fields: [
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

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('shipping: z.object({')
        expect(schema).toContain('address: z.string()')
    })

    test('should build deeply nested object (3 levels)', () => {
        const field: ParsedResponseField = {
            name: 'order',
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: false,
            fields: [
                {
                    name: 'shipping',
                    kind: 'object',
                    type: 'object',
                    nullable: false,
                    optional: false,
                    fields: [
                        {
                            name: 'address',
                            kind: 'object',
                            type: 'object',
                            nullable: false,
                            optional: false,
                            fields: [
                                {
                                    name: 'street',
                                    kind: 'primitive',
                                    type: 'string',
                                    nullable: false,
                                    optional: false
                                }
                            ]
                        }
                    ]
                }
            ]
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('shipping: z.object({')
        expect(schema).toContain('address: z.object({')
        expect(schema).toContain('street: z.string()')
    })

    test('should handle nullable nested object', () => {
        const field: ParsedResponseField = {
            name: 'order',
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: false,
            fields: [
                {
                    name: 'shipping',
                    kind: 'object',
                    type: 'object',
                    nullable: true,
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

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('shipping: z.object({')
        expect(schema).toContain('address: z.string()')
        expect(schema).toContain('.nullable()')
    })

    test('should handle multiple nested objects at same level', () => {
        const field: ParsedResponseField = {
            name: 'order',
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: false,
            fields: [
                {
                    name: 'shipping',
                    kind: 'object',
                    type: 'object',
                    nullable: false,
                    optional: false,
                    fields: [
                        { name: 'address', kind: 'primitive', type: 'string', nullable: false, optional: false }
                    ]
                },
                {
                    name: 'payment',
                    kind: 'object',
                    type: 'object',
                    nullable: false,
                    optional: false,
                    fields: [
                        { name: 'method', kind: 'primitive', type: 'string', nullable: false, optional: false }
                    ]
                }
            ]
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('shipping: z.object({')
        expect(schema).toContain('address: z.string()')
        expect(schema).toContain('payment: z.object({')
        expect(schema).toContain('method: z.string()')
    })

    // ===== ARRAYS IN OBJECTS =====

    test('should handle array of primitives in object', () => {
        const field: ParsedResponseField = {
            name: 'user',
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: false,
            fields: [
                {
                    name: 'tags',
                    kind: 'array',
                    type: 'array',
                    nullable: false,
                    optional: false,
                    itemType: {
                        name: 'item',
                        kind: 'primitive',
                        type: 'string',
                        nullable: false,
                        optional: false
                    }
                }
            ]
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('tags: z.array(z.string())')
    })

    test('should handle array of objects in object', () => {
        const field: ParsedResponseField = {
            name: 'order',
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: false,
            fields: [
                {
                    name: 'items',
                    kind: 'array',
                    type: 'array',
                    nullable: false,
                    optional: false,
                    itemType: {
                        name: 'item',
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
                            }
                        ]
                    }
                }
            ]
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('items: z.array(z.object({')
        expect(schema).toContain('id: z.number()')
    })

    // ===== COMPLEX REAL-WORLD STRUCTURES =====

    test('should build e-commerce shipping object', () => {
        const field: ParsedResponseField = {
            name: 'shipping',
            kind: 'object',
            type: 'object',
            nullable: true,
            optional: true,
            fields: [
                { name: 'nama', kind: 'primitive', type: 'string', nullable: true, optional: false },
                { name: 'telepon', kind: 'primitive', type: 'string', nullable: true, optional: false },
                { name: 'alamat', kind: 'primitive', type: 'string', nullable: true, optional: false },
                { name: 'kota', kind: 'primitive', type: 'string', nullable: true, optional: false },
                { name: 'kode_pos', kind: 'primitive', type: 'string', nullable: true, optional: false }
            ]
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toContain('nama: z.string().nullable()')
        expect(schema).toContain('telepon: z.string().nullable()')
        expect(schema).toContain('alamat: z.string().nullable()')
        expect(schema).toContain('.nullable()')
        expect(schema).toContain('.optional()')
    })

    // ===== ERROR HANDLING =====

    test('should throw error for non-object field', () => {
        const field: ParsedResponseField = {
            name: 'test',
            kind: 'primitive',
            type: 'string',
            nullable: false,
            optional: false
        }

        expect(() => builder.buildObjectSchema(field)).toThrow('Expected object field')
    })

    test('should handle object without fields property', () => {
        const field: ParsedResponseField = {
            name: 'empty',
            kind: 'object',
            type: 'object',
            nullable: false,
            optional: false
            // No fields property
        }

        const schema = builder.buildObjectSchema(field)

        expect(schema).toBe('z.object({})')
    })
})
