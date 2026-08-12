/**
 * Tests for ResponseSchemaMapper
 * 
 * Integration tests untuk complete response schema mapping
 */

import { describe, test, expect } from 'vitest'
import { ResponseSchemaMapper } from '../ResponseSchemaMapper'
import type { ResponseTypeInfo } from '../ResponseSchemaMapper'

describe('ResponseSchemaMapper', () => {
    const mapper = new ResponseSchemaMapper()

    describe('mapActionResponse', () => {
        test('should map simple object response for show action', () => {
            const responseType: ResponseTypeInfo = {
                type: 'User',
                collection: false,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                    { name: 'name', kind: 'primitive', type: 'string', nullable: false, optional: false }
                ]
            }

            const result = mapper.mapActionResponse('show', responseType, 'user')

            expect(result.action).toBe('show')
            expect(result.schemaName).toBe('userShowSchema')
            expect(result.isArray).toBe(false)
            expect(result.zodSchema).toBe('z.object({\n  id: z.number(),\n  name: z.string()\n})')
        })

        test('should map array response for index action', () => {
            const responseType: ResponseTypeInfo = {
                type: 'User',
                collection: true,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                    { name: 'name', kind: 'primitive', type: 'string', nullable: false, optional: false }
                ]
            }

            const result = mapper.mapActionResponse('index', responseType, 'user')

            expect(result.action).toBe('index')
            expect(result.schemaName).toBe('userIndexSchema')
            expect(result.isArray).toBe(true)
            expect(result.zodSchema).toContain('z.array(')
            expect(result.zodSchema).toContain('z.object({')
        })

        test('should map nested object response', () => {
            const responseType: ResponseTypeInfo = {
                type: 'Order',
                collection: false,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                    {
                        name: 'shipping',
                        kind: 'object',
                        fields: [
                            { name: 'address', kind: 'primitive', type: 'string', nullable: false, optional: false },
                            { name: 'phone', kind: 'primitive', type: 'string', nullable: false, optional: false }
                        ]
                    }
                ]
            }

            const result = mapper.mapActionResponse('show', responseType, 'order')

            expect(result.schemaName).toBe('orderShowSchema')
            expect(result.zodSchema).toContain('shipping: z.object({')
            expect(result.zodSchema).toContain('address: z.string()')
        })

        test('should handle nullable fields', () => {
            const responseType: ResponseTypeInfo = {
                type: 'Product',
                collection: false,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                    { name: 'description', kind: 'primitive', type: 'string', nullable: true, optional: false }
                ]
            }

            const result = mapper.mapActionResponse('show', responseType, 'product')

            expect(result.zodSchema).toContain('description: z.string().nullable()')
        })

        test('should handle optional fields', () => {
            const responseType: ResponseTypeInfo = {
                type: 'User',
                collection: false,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                    { name: 'bio', kind: 'primitive', type: 'string', optional: true }
                ]
            }

            const result = mapper.mapActionResponse('show', responseType, 'user')

            expect(result.zodSchema).toContain('bio: z.string().optional()')
        })

        test('should handle array fields', () => {
            const responseType: ResponseTypeInfo = {
                type: 'Order',
                collection: false,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                    {
                        name: 'items',
                        kind: 'array',
                        itemType: {
                            name: 'item',
                            kind: 'object',
                            type: 'object',
                            nullable: false,
                            optional: false,
                            fields: [
                                { name: 'productId', kind: 'primitive', type: 'number', nullable: false, optional: false },
                                { name: 'quantity', kind: 'primitive', type: 'number', nullable: false, optional: false }
                            ]
                        }
                    }
                ]
            }

            const result = mapper.mapActionResponse('show', responseType, 'order')

            expect(result.zodSchema).toContain('items: z.array(z.object({')
            expect(result.zodSchema).toContain('productId: z.number()')
        })

        test('should generate correct schema name for hyphenated resource', () => {
            const responseType: ResponseTypeInfo = {
                type: 'ProductCategory',
                collection: false,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false }
                ]
            }

            const result = mapper.mapActionResponse('index', responseType, 'product-category')

            expect(result.schemaName).toBe('productCategoryIndexSchema')
        })

        test('should generate correct schema name for snake_case resource', () => {
            const responseType: ResponseTypeInfo = {
                type: 'ShippingAddress',
                collection: false,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false }
                ]
            }

            const result = mapper.mapActionResponse('show', responseType, 'shipping_address')

            expect(result.schemaName).toBe('shippingAddressShowSchema')
        })
    })

    describe('mapResourceResponses', () => {
        test('should map all actions for a resource', () => {
            const actions = {
                index: {
                    type: 'User',
                    collection: true,
                    fields: [
                        { name: 'id', kind: 'primitive' as const, type: 'number', nullable: false, optional: false },
                        { name: 'name', kind: 'primitive' as const, type: 'string', nullable: false, optional: false }
                    ]
                },
                show: {
                    type: 'User',
                    collection: false,
                    fields: [
                        { name: 'id', kind: 'primitive' as const, type: 'number', nullable: false, optional: false },
                        { name: 'name', kind: 'primitive' as const, type: 'string', nullable: false, optional: false },
                        { name: 'email', kind: 'primitive' as const, type: 'string', nullable: false, optional: false }
                    ]
                },
                store: null,
                update: null,
                destroy: null
            }

            const result = mapper.mapResourceResponses('user', actions)

            expect(result.resourceName).toBe('user')
            expect(result.schemas).toHaveLength(2)

            const indexSchema = result.schemas.find(s => s.action === 'index')
            expect(indexSchema).toBeDefined()
            expect(indexSchema!.schemaName).toBe('userIndexSchema')
            expect(indexSchema!.isArray).toBe(true)

            const showSchema = result.schemas.find(s => s.action === 'show')
            expect(showSchema).toBeDefined()
            expect(showSchema!.schemaName).toBe('userShowSchema')
            expect(showSchema!.isArray).toBe(false)
        })

        test('should skip null actions', () => {
            const actions = {
                index: {
                    type: 'Product',
                    collection: true,
                    fields: [{ name: 'id', kind: 'primitive' as const, type: 'number', nullable: false, optional: false }]
                },
                show: null,
                store: null,
                update: null,
                destroy: null
            }

            const result = mapper.mapResourceResponses('product', actions)

            expect(result.schemas).toHaveLength(1)
            expect(result.schemas[0].action).toBe('index')
        })
    })

    describe('E-commerce scenarios', () => {
        test('should map checkout response with nested shipping', () => {
            const responseType: ResponseTypeInfo = {
                type: 'Checkout',
                collection: false,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                    {
                        name: 'shipping',
                        kind: 'object',
                        nullable: true,
                        fields: [
                            { name: 'nama', kind: 'primitive', type: 'string', nullable: true, optional: false },
                            { name: 'telepon', kind: 'primitive', type: 'string', nullable: true, optional: false },
                            { name: 'alamat', kind: 'primitive', type: 'string', nullable: true, optional: false }
                        ]
                    }
                ]
            }

            const result = mapper.mapActionResponse('show', responseType, 'checkout')

            expect(result.zodSchema).toContain('shipping: z.object({')
            expect(result.zodSchema).toContain('nama: z.string().nullable()')
            expect(result.zodSchema).toContain('}).nullable()')
        })

        test('should map order with items array', () => {
            const responseType: ResponseTypeInfo = {
                type: 'Order',
                collection: false,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                    {
                        name: 'items',
                        kind: 'array',
                        itemType: {
                            name: 'item',
                            kind: 'object',
                            type: 'object',
                            nullable: false,
                            optional: false,
                            fields: [
                                { name: 'produkItemId', kind: 'primitive', type: 'number', nullable: false, optional: false },
                                { name: 'qty', kind: 'primitive', type: 'number', nullable: false, optional: false },
                                { name: 'harga', kind: 'primitive', type: 'number', nullable: false, optional: false }
                            ]
                        }
                    },
                    { name: 'total', kind: 'primitive', type: 'number', nullable: false, optional: false }
                ]
            }

            const result = mapper.mapActionResponse('show', responseType, 'order')

            expect(result.zodSchema).toContain('items: z.array(z.object({')
            expect(result.zodSchema).toContain('produkItemId: z.number()')
            expect(result.zodSchema).toContain('total: z.number()')
        })

        test('should map product with variants array', () => {
            const responseType: ResponseTypeInfo = {
                type: 'Product',
                collection: false,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                    { name: 'name', kind: 'primitive', type: 'string', nullable: false, optional: false },
                    {
                        name: 'variants',
                        kind: 'array',
                        itemType: {
                            name: 'item',
                            kind: 'object',
                            type: 'object',
                            nullable: false,
                            optional: false,
                            fields: [
                                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                                { name: 'size', kind: 'primitive', type: 'string', nullable: false, optional: false },
                                { name: 'price', kind: 'primitive', type: 'number', nullable: false, optional: false },
                                { name: 'stock', kind: 'primitive', type: 'number', nullable: true, optional: false }
                            ]
                        }
                    }
                ]
            }

            const result = mapper.mapActionResponse('show', responseType, 'product')

            expect(result.zodSchema).toContain('variants: z.array(z.object({')
            expect(result.zodSchema).toContain('stock: z.number().nullable()')
        })
    })

    describe('Edge cases', () => {
        test('should handle empty object response', () => {
            const responseType: ResponseTypeInfo = {
                type: 'Empty',
                collection: false,
                fields: []
            }

            const result = mapper.mapActionResponse('show', responseType, 'empty')

            expect(result.zodSchema).toBe('z.object({})')
        })

        test('should handle deeply nested objects', () => {
            const responseType: ResponseTypeInfo = {
                type: 'Complex',
                collection: false,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                    {
                        name: 'level1',
                        kind: 'object',
                        fields: [
                            {
                                name: 'level2',
                                kind: 'object',
                                type: 'object',
                                nullable: false,
                                optional: false,
                                fields: [
                                    {
                                        name: 'level3',
                                        kind: 'object',
                                        type: 'object',
                                        nullable: false,
                                        optional: false,
                                        fields: [
                                            { name: 'value', kind: 'primitive', type: 'string', nullable: false, optional: false }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }

            const result = mapper.mapActionResponse('show', responseType, 'complex')

            expect(result.zodSchema).toContain('level1: z.object({')
            expect(result.zodSchema).toContain('level2: z.object({')
            expect(result.zodSchema).toContain('level3: z.object({')
            expect(result.zodSchema).toContain('value: z.string()')
        })

        test('should handle mixed nullable and optional', () => {
            const responseType: ResponseTypeInfo = {
                type: 'Mixed',
                collection: false,
                fields: [
                    { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                    { name: 'nullableField', kind: 'primitive', type: 'string', nullable: true, optional: false },
                    { name: 'optionalField', kind: 'primitive', type: 'string', optional: true },
                    { name: 'bothField', kind: 'primitive', type: 'string', nullable: true, optional: true }
                ]
            }

            const result = mapper.mapActionResponse('show', responseType, 'mixed')

            expect(result.zodSchema).toContain('nullableField: z.string().nullable()')
            expect(result.zodSchema).toContain('optionalField: z.string().optional()')
            expect(result.zodSchema).toContain('bothField: z.string().nullable().optional()')
        })
    })
})
