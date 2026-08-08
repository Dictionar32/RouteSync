/**
 * Response Action Builder Tests
 * 
 * Tests for building response action schemas (index/show).
 * 
 * Coverage:
 * - buildShowSchema() - single resource schema
 * - buildIndexSchema() - array schema
 * - schema naming conventions
 * - integration with ResponseSchemaMapper
 * 
 * @module compiler/generators/contract-generation/__tests__
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseActionBuilder } from '../ResponseActionBuilder';
import { ResponseSchemaMapper } from '../ResponseSchemaMapper';
import { ResponseFieldParser } from '../ResponseFieldParser';
import { ZodModifierBuilder } from '../ZodModifierBuilder';
import { NestedObjectSchemaBuilder } from '../NestedObjectSchemaBuilder';
import { ArraySchemaBuilder } from '../ArraySchemaBuilder';
import { PrimitiveTypeRegistry } from '../PrimitiveTypeRegistry';

describe('ResponseActionBuilder', () => {
    let builder: ResponseActionBuilder;
    let responseSchemaMapper: ResponseSchemaMapper;

    beforeEach(() => {
        // Create complete mapper with all dependencies
        const primitiveRegistry = new PrimitiveTypeRegistry();
        const zodModifierBuilder = new ZodModifierBuilder();
        const nestedObjectBuilder = new NestedObjectSchemaBuilder(
            primitiveRegistry,
            zodModifierBuilder
        );
        const arraySchemaBuilder = new ArraySchemaBuilder(
            primitiveRegistry,
            nestedObjectBuilder,
            zodModifierBuilder
        );

        responseSchemaMapper = new ResponseSchemaMapper(
            nestedObjectBuilder,
            arraySchemaBuilder
        );

        builder = new ResponseActionBuilder(responseSchemaMapper);
    });

    describe('buildShowSchema()', () => {
        it('should build schema for simple response', () => {
            const fields = [
                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                { name: 'name', kind: 'primitive', type: 'string', nullable: false, optional: false },
                { name: 'email', kind: 'primitive', type: 'string', nullable: false, optional: true }
            ];

            const schema = builder.buildShowSchema('user', fields);

            expect(schema.schemaName).toBe('userShowSchema');
            expect(schema.action).toBe('show');
            expect(schema.resourceName).toBe('user');
            expect(schema.zodSchema).toContain('z.object({');
            expect(schema.zodSchema).toContain('id: z.number()');
            expect(schema.zodSchema).toContain('name: z.string()');
            expect(schema.zodSchema).toContain('email: z.string().optional()');
        });

        it('should build schema with nested object', () => {
            const fields = [
                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                {
                    name: 'address',
                    kind: 'object',
                    type: 'object',
                    nullable: false,
                    optional: false,
                    fields: [
                        { name: 'street', kind: 'primitive', type: 'string', nullable: false, optional: false },
                        { name: 'city', kind: 'primitive', type: 'string', nullable: false, optional: false }
                    ]
                }
            ];

            const schema = builder.buildShowSchema('user', fields);

            expect(schema.zodSchema).toContain('address: z.object({');
            expect(schema.zodSchema).toContain('street: z.string()');
            expect(schema.zodSchema).toContain('city: z.string()');
        });

        it('should build schema with array field', () => {
            const fields = [
                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
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
            ];

            const schema = builder.buildShowSchema('post', fields);

            expect(schema.zodSchema).toContain('tags: z.array(z.string())');
        });

        it('should handle PascalCase resource name', () => {
            const fields = [
                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false }
            ];

            const schema = builder.buildShowSchema('UserProfile', fields);

            // Should convert to camelCase: userProfileShowSchema
            expect(schema.schemaName).toBe('userProfileShowSchema');
        });

        it('should handle kebab-case resource name', () => {
            const fields = [
                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false }
            ];

            const schema = builder.buildShowSchema('user-profile', fields);

            // Should convert to camelCase: userProfileShowSchema
            expect(schema.schemaName).toBe('userProfileShowSchema');
        });

        it('should handle empty fields', () => {
            const schema = builder.buildShowSchema('empty', []);

            expect(schema.schemaName).toBe('emptyShowSchema');
            expect(schema.zodSchema).toContain('z.object({})');
        });
    });

    describe('buildIndexSchema()', () => {
        it('should wrap schema in z.array()', () => {
            const fields = [
                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                { name: 'name', kind: 'primitive', type: 'string', nullable: false, optional: false }
            ];

            const schema = builder.buildIndexSchema('user', fields);

            expect(schema.schemaName).toBe('userIndexSchema');
            expect(schema.action).toBe('index');
            expect(schema.resourceName).toBe('user');
            expect(schema.zodSchema).toMatch(/^z\.array\(/);
            expect(schema.zodSchema).toContain('z.object({');
            expect(schema.zodSchema).toContain('id: z.number()');
        });

        it('should build array schema with nested objects', () => {
            const fields = [
                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
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
                            { name: 'itemId', kind: 'primitive', type: 'number', nullable: false, optional: false },
                            { name: 'qty', kind: 'primitive', type: 'number', nullable: false, optional: false }
                        ]
                    }
                }
            ];

            const schema = builder.buildIndexSchema('cart', fields);

            expect(schema.zodSchema).toMatch(/^z\.array\(/);
            expect(schema.zodSchema).toContain('items: z.array(z.object({');
            expect(schema.zodSchema).toContain('itemId: z.number()');
        });

        it('should handle PascalCase resource for index', () => {
            const fields = [
                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false }
            ];

            const schema = builder.buildIndexSchema('CartItems', fields);

            expect(schema.schemaName).toBe('cartItemsIndexSchema');
        });

        it('should handle empty fields in array', () => {
            const schema = builder.buildIndexSchema('empty', []);

            expect(schema.schemaName).toBe('emptyIndexSchema');
            expect(schema.zodSchema).toContain('z.array(z.object({}))');
        });
    });

    describe('schema naming', () => {
        it('should generate correct show schema names', () => {
            const testCases = [
                { resource: 'user', expected: 'userShowSchema' },
                { resource: 'checkout', expected: 'checkoutShowSchema' },
                { resource: 'cartItems', expected: 'cartItemsShowSchema' },
                { resource: 'UserProfile', expected: 'userProfileShowSchema' },
                { resource: 'user-profile', expected: 'userProfileShowSchema' }
            ];

            for (const { resource, expected } of testCases) {
                const schema = builder.buildShowSchema(resource, []);
                expect(schema.schemaName).toBe(expected);
            }
        });

        it('should generate correct index schema names', () => {
            const testCases = [
                { resource: 'user', expected: 'userIndexSchema' },
                { resource: 'checkout', expected: 'checkoutIndexSchema' },
                { resource: 'cartItems', expected: 'cartItemsIndexSchema' },
                { resource: 'UserProfile', expected: 'userProfileIndexSchema' }
            ];

            for (const { resource, expected } of testCases) {
                const schema = builder.buildIndexSchema(resource, []);
                expect(schema.schemaName).toBe(expected);
            }
        });
    });

    describe('integration with ResponseSchemaMapper', () => {
        it('should delegate schema generation to mapper', () => {
            const fields = [
                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                {
                    name: 'nested',
                    kind: 'object',
                    type: 'object',
                    nullable: false,
                    optional: false,
                    fields: [
                        { name: 'field', kind: 'primitive', type: 'string', nullable: false, optional: false }
                    ]
                }
            ];

            const showSchema = builder.buildShowSchema('test', fields);
            const indexSchema = builder.buildIndexSchema('test', fields);

            // Both should use ResponseSchemaMapper
            expect(showSchema.zodSchema).toContain('z.object({');
            expect(indexSchema.zodSchema).toContain('z.array(z.object({');

            // Both should have nested object
            expect(showSchema.zodSchema).toContain('nested: z.object({');
            expect(indexSchema.zodSchema).toContain('nested: z.object({');
        });
    });

    describe('complex response structures', () => {
        it('should handle deeply nested response', () => {
            const fields = [
                {
                    name: 'data',
                    kind: 'object',
                    type: 'object',
                    nullable: false,
                    optional: false,
                    fields: [
                        {
                            name: 'user',
                            kind: 'object',
                            type: 'object',
                            nullable: false,
                            optional: false,
                            fields: [
                                {
                                    name: 'profile',
                                    kind: 'object',
                                    type: 'object',
                                    nullable: false,
                                    optional: false,
                                    fields: [
                                        { name: 'name', kind: 'primitive', type: 'string', nullable: false, optional: false }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ];

            const schema = builder.buildShowSchema('nested', fields);

            expect(schema.zodSchema).toContain('data: z.object({');
            expect(schema.zodSchema).toContain('user: z.object({');
            expect(schema.zodSchema).toContain('profile: z.object({');
            expect(schema.zodSchema).toContain('name: z.string()');
        });

        it('should handle array of nested objects', () => {
            const fields = [
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
                                name: 'product',
                                kind: 'object',
                                type: 'object',
                                nullable: false,
                                optional: false,
                                fields: [
                                    { name: 'name', kind: 'primitive', type: 'string', nullable: false, optional: false },
                                    { name: 'price', kind: 'primitive', type: 'number', nullable: false, optional: false }
                                ]
                            },
                            { name: 'qty', kind: 'primitive', type: 'number', nullable: false, optional: false }
                        ]
                    }
                }
            ];

            const schema = builder.buildShowSchema('order', fields);

            expect(schema.zodSchema).toContain('items: z.array(z.object({');
            expect(schema.zodSchema).toContain('product: z.object({');
            expect(schema.zodSchema).toContain('name: z.string()');
            expect(schema.zodSchema).toContain('price: z.number()');
        });
    });
});
