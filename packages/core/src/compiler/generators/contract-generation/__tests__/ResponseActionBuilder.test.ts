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
import { ResponseFieldParser, type ParsedResponseField } from '../ResponseFieldParser';
import { ZodModifierBuilder } from '../ZodModifierBuilder';
import { NestedObjectSchemaBuilder } from '../NestedObjectSchemaBuilder';
import { ArraySchemaBuilder } from '../ArraySchemaBuilder';

describe('ResponseActionBuilder', () => {
    let builder: ResponseActionBuilder;
    let responseSchemaMapper: ResponseSchemaMapper;

    beforeEach(() => {
        // Signatures sesuai refactor dependency injection:
        // - NestedObjectSchemaBuilder(zodModifierBuilder) — 1 param
        // - ArraySchemaBuilder(nestedObjectBuilder, zodModifierBuilder) — 2 param
        // - ResponseSchemaMapper() — self-contained, 0 param
        const zodModifierBuilder = new ZodModifierBuilder();
        const nestedObjectBuilder = new NestedObjectSchemaBuilder(zodModifierBuilder);
        const arraySchemaBuilder = new ArraySchemaBuilder(
            nestedObjectBuilder,
            zodModifierBuilder
        );

        responseSchemaMapper = new ResponseSchemaMapper();

        builder = new ResponseActionBuilder(responseSchemaMapper);
    });

    describe('buildShowSchema()', () => {
        it('should build schema for simple response', () => {
            const fields: ParsedResponseField[] = [
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
            const fields: ParsedResponseField[] = [
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
            const fields: ParsedResponseField[] = [
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
            const fields: ParsedResponseField[] = [
                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false }
            ];

            const schema = builder.buildShowSchema('UserProfile', fields);

            // Should convert to camelCase: userProfileShowSchema
            expect(schema.schemaName).toBe('userProfileShowSchema');
        });

        it('should handle kebab-case resource name', () => {
            const fields: ParsedResponseField[] = [
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
        it('should reference show schema in z.array()', () => {
            const fields: ParsedResponseField[] = [
                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false },
                { name: 'name', kind: 'primitive', type: 'string', nullable: false, optional: false }
            ];

            // Build show schema first
            const showSchema = builder.buildShowSchema('user', fields);

            // Build index schema referencing show schema
            const schema = builder.buildIndexSchema('user', showSchema.schemaName);

            expect(schema.schemaName).toBe('userIndexSchema');
            expect(schema.action).toBe('index');
            expect(schema.resourceName).toBe('user');
            expect(schema.zodSchema).toBe(`z.array(${showSchema.schemaName})`);
        });

        it('should build array schema referencing show schema', () => {
            const fields: ParsedResponseField[] = [
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

            const showSchema = builder.buildShowSchema('cart', fields);
            const schema = builder.buildIndexSchema('cart', showSchema.schemaName);

            expect(schema.zodSchema).toBe(`z.array(${showSchema.schemaName})`);
        });

        it('should handle PascalCase resource for index', () => {
            const fields: ParsedResponseField[] = [
                { name: 'id', kind: 'primitive', type: 'number', nullable: false, optional: false }
            ];

            const showSchema = builder.buildShowSchema('CartItems', fields);
            const schema = builder.buildIndexSchema('CartItems', showSchema.schemaName);

            expect(schema.schemaName).toBe('cartItemsIndexSchema');
        });

        it('should handle empty fields in array', () => {
            const showSchema = builder.buildShowSchema('empty', []);
            const schema = builder.buildIndexSchema('empty', showSchema.schemaName);

            expect(schema.schemaName).toBe('emptyIndexSchema');
            expect(schema.zodSchema).toBe(`z.array(${showSchema.schemaName})`);
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
                const showSchema = builder.buildShowSchema(resource, []);
                const schema = builder.buildIndexSchema(resource, showSchema.schemaName);
                expect(schema.schemaName).toBe(expected);
            }
        });
    });

    describe('integration with ResponseSchemaMapper', () => {
        it('should delegate schema generation to mapper', () => {
            const fields: ParsedResponseField[] = [
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
            const indexSchema = builder.buildIndexSchema('test', showSchema.schemaName);

            // Show should use ResponseSchemaMapper
            expect(showSchema.zodSchema).toContain('z.object({');

            // Index should reference show schema
            expect(indexSchema.zodSchema).toBe(`z.array(${showSchema.schemaName})`);
        });
    });

    describe('complex response structures', () => {
        it('should handle deeply nested response', () => {
            const fields: ParsedResponseField[] = [
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
            const fields: ParsedResponseField[] = [
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
