import { describe, test, expect } from 'vitest';
import { ResponseFieldParser } from '../ResponseFieldParser';
import type { ResponseFieldData } from '../ResponseFieldParser';

describe('ResponseFieldParser', () => {
    const parser = new ResponseFieldParser();

    describe('Primitive Fields', () => {
        test('should parse simple primitive field', () => {
            const fieldData: ResponseFieldData = {
                kind: 'primitive',
                type: 'string',
            };

            const result = parser.parseField('name', fieldData);

            expect(result).toEqual({
                name: 'name',
                kind: 'primitive',
                type: 'string',
                nullable: false,
                optional: false,
            });
        });

        test('should parse number primitive', () => {
            const fieldData: ResponseFieldData = {
                kind: 'primitive',
                type: 'number',
            };

            const result = parser.parseField('id', fieldData);

            expect(result.kind).toBe('primitive');
            expect(result.type).toBe('number');
        });

        test('should parse boolean primitive', () => {
            const fieldData: ResponseFieldData = {
                kind: 'primitive',
                type: 'boolean',
            };

            const result = parser.parseField('active', fieldData);

            expect(result.kind).toBe('primitive');
            expect(result.type).toBe('boolean');
        });

        test('should normalize integer to number', () => {
            const fieldData: ResponseFieldData = {
                kind: 'primitive',
                type: 'integer',
            };

            const result = parser.parseField('count', fieldData);

            expect(result.type).toBe('number');
        });

        test('should normalize int to number', () => {
            const fieldData: ResponseFieldData = {
                kind: 'primitive',
                type: 'int',
            };

            const result = parser.parseField('qty', fieldData);

            expect(result.type).toBe('number');
        });

        test('should normalize bool to boolean', () => {
            const fieldData: ResponseFieldData = {
                kind: 'primitive',
                type: 'bool',
            };

            const result = parser.parseField('flag', fieldData);

            expect(result.type).toBe('boolean');
        });
    });

    describe('Variable and Property Access', () => {
        test('should parse variable as primitive', () => {
            const fieldData: ResponseFieldData = {
                kind: 'variable',
                resolved: {
                    status: 'resolved',
                    type: 'string',
                },
            };

            const result = parser.parseField('token', fieldData);

            expect(result.kind).toBe('primitive');
            expect(result.type).toBe('string');
        });

        test('should parse property_access as primitive', () => {
            const fieldData: ResponseFieldData = {
                kind: 'property_access',
                resolved: {
                    status: 'resolved',
                    type: 'number',
                },
            };

            const result = parser.parseField('userId', fieldData);

            expect(result.kind).toBe('primitive');
            expect(result.type).toBe('number');
        });

        test('should use resolved model name', () => {
            const fieldData: ResponseFieldData = {
                kind: 'variable',
                resolved: {
                    status: 'resolved',
                    model: 'User',
                },
            };

            const result = parser.parseField('user', fieldData);

            expect(result.type).toBe('User');
        });
    });

    describe('Object Fields', () => {
        test('should parse simple object field', () => {
            const fieldData: ResponseFieldData = {
                kind: 'object',
                fields: {
                    id: { kind: 'primitive', type: 'number' },
                    name: { kind: 'primitive', type: 'string' },
                },
            };

            const result = parser.parseField('user', fieldData);

            expect(result.kind).toBe('object');
            expect(result.fields).toHaveLength(2);
            expect(result.fields?.[0].name).toBe('id');
            expect(result.fields?.[1].name).toBe('name');
        });

        test('should parse nested object', () => {
            const fieldData: ResponseFieldData = {
                kind: 'object',
                fields: {
                    shipping: {
                        kind: 'object',
                        fields: {
                            nama: { kind: 'primitive', type: 'string' },
                            telepon: { kind: 'primitive', type: 'string' },
                        },
                    },
                },
            };

            const result = parser.parseField('order', fieldData);

            expect(result.kind).toBe('object');
            expect(result.fields).toHaveLength(1);
            expect(result.fields?.[0].name).toBe('shipping');
            expect(result.fields?.[0].kind).toBe('object');
            expect(result.fields?.[0].fields).toHaveLength(2);
        });

        test('should parse deeply nested object', () => {
            const fieldData: ResponseFieldData = {
                kind: 'object',
                fields: {
                    data: {
                        kind: 'object',
                        fields: {
                            user: {
                                kind: 'object',
                                fields: {
                                    profile: {
                                        kind: 'object',
                                        fields: {
                                            name: { kind: 'primitive', type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            };

            const result = parser.parseField('response', fieldData);

            expect(result.kind).toBe('object');
            // Navigate to deeply nested field
            const data = result.fields?.[0];
            const user = data?.fields?.[0];
            const profile = user?.fields?.[0];
            const name = profile?.fields?.[0];

            expect(name?.name).toBe('name');
            expect(name?.type).toBe('string');
        });
    });

    describe('Array Fields', () => {
        test('should parse array of primitives', () => {
            const fieldData: ResponseFieldData = {
                kind: 'array',
                itemType: {
                    kind: 'primitive',
                    type: 'string',
                },
            };

            const result = parser.parseField('tags', fieldData);

            expect(result.kind).toBe('array');
            expect(result.itemType).toBeDefined();
            expect(result.itemType?.kind).toBe('primitive');
            expect(result.itemType?.type).toBe('string');
        });

        test('should parse array of objects', () => {
            const fieldData: ResponseFieldData = {
                kind: 'array',
                itemType: {
                    kind: 'object',
                    fields: {
                        id: { kind: 'primitive', type: 'number' },
                        name: { kind: 'primitive', type: 'string' },
                    },
                },
            };

            const result = parser.parseField('items', fieldData);

            expect(result.kind).toBe('array');
            expect(result.itemType?.kind).toBe('object');
            expect(result.itemType?.fields).toHaveLength(2);
        });

        test('should parse array of nested objects', () => {
            const fieldData: ResponseFieldData = {
                kind: 'array',
                itemType: {
                    kind: 'object',
                    fields: {
                        produk_item_id: { kind: 'primitive', type: 'number' },
                        produk: {
                            kind: 'object',
                            fields: {
                                id: { kind: 'primitive', type: 'number' },
                                nama: { kind: 'primitive', type: 'string' },
                            },
                        },
                        qty: { kind: 'primitive', type: 'number' },
                    },
                },
            };

            const result = parser.parseField('items', fieldData);

            expect(result.kind).toBe('array');
            expect(result.itemType?.kind).toBe('object');
            expect(result.itemType?.fields).toHaveLength(3);

            // Check nested produk object
            const produkField = result.itemType?.fields?.find(f => f.name === 'produk');
            expect(produkField?.kind).toBe('object');
            expect(produkField?.fields).toHaveLength(2);
        });
    });

    describe('Nullable and Optional', () => {
        test('should detect nullable from resolved type', () => {
            const fieldData: ResponseFieldData = {
                kind: 'primitive',
                type: 'string',
                resolved: {
                    status: 'resolved',
                    type: 'string | null',
                },
            };

            const result = parser.parseField('optional_field', fieldData);

            expect(result.nullable).toBe(true);
        });

        test('should default nullable to false', () => {
            const fieldData: ResponseFieldData = {
                kind: 'primitive',
                type: 'string',
            };

            const result = parser.parseField('required_field', fieldData);

            expect(result.nullable).toBe(false);
        });

        test('should default optional to false', () => {
            const fieldData: ResponseFieldData = {
                kind: 'primitive',
                type: 'string',
            };

            const result = parser.parseField('field', fieldData);

            expect(result.optional).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        test('should handle unknown kind', () => {
            const fieldData: ResponseFieldData = {
                kind: 'unknown' as any,
                type: 'string',
            };

            const result = parser.parseField('field', fieldData);

            // Should default to primitive
            expect(result.kind).toBe('primitive');
        });

        test('should handle missing type', () => {
            const fieldData: ResponseFieldData = {
                kind: 'primitive',
            };

            const result = parser.parseField('field', fieldData);

            expect(result.type).toBe('unknown');
        });

        test('should handle object without fields', () => {
            const fieldData: ResponseFieldData = {
                kind: 'object',
            };

            const result = parser.parseField('empty_obj', fieldData);

            expect(result.kind).toBe('object');
            expect(result.fields).toBeUndefined();
        });

        test('should handle array without items', () => {
            const fieldData: ResponseFieldData = {
                kind: 'array',
            };

            const result = parser.parseField('empty_array', fieldData);

            expect(result.kind).toBe('array');
            expect(result.itemType).toBeUndefined();
        });
    });
});
