/**
 * FormActionGenerator.test.ts
 * 
 * Unit tests for FormActionGenerator - Pure formatting logic
 * Tests action block generation from fields
 */

import { describe, test, expect } from 'vitest';
import { FormActionGenerator } from '../FormActionGenerator';
import { PrimitiveType, PrimitiveKind, ReferenceType, ReadonlyCollectionType, CollectionKind } from '../../../types/SemanticType';
import type { RequestField } from '../../../artifacts/RequestTypesArtifact';

describe('FormActionGenerator', () => {
    const generator = new FormActionGenerator();

    describe('Basic action generation', () => {
        test('should generate create action with single field', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'product_id',
                    transformedName: 'productId',
                    type: new PrimitiveType(PrimitiveKind.NUMBER),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.name).toBe('create');
            expect(action.fieldCount).toBe(1);
            expect(action.lines).toEqual([
                '  create: {',
                '    productId: number',
                '  }'
            ]);
        });

        test('should generate update action with multiple fields', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'name',
                    transformedName: 'name',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'email',
                    transformedName: 'email',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('update', fields);

            expect(action.name).toBe('update');
            expect(action.fieldCount).toBe(2);
            expect(action.lines).toEqual([
                '  update: {',
                '    name: string',
                '    email: string',
                '  }'
            ]);
        });

        test('should generate action with no fields', () => {
            const fields: RequestField[] = [];

            const action = generator.generateAction('create', fields);

            expect(action.name).toBe('create');
            expect(action.fieldCount).toBe(0);
            expect(action.lines).toEqual([
                '  create: {',
                '    // No fields',
                '  }'
            ]);
        });
    });

    describe('Optional field handling', () => {
        test('should mark optional fields with question mark', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'description',
                    transformedName: 'description',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: false,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines).toEqual([
                '  create: {',
                '    description?: string',
                '  }'
            ]);
        });

        test('should not mark required fields with question mark', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'name',
                    transformedName: 'name',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines).toEqual([
                '  create: {',
                '    name: string',
                '  }'
            ]);
        });

        test('should handle mix of required and optional fields', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'name',
                    transformedName: 'name',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'description',
                    transformedName: 'description',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: false,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines).toEqual([
                '  create: {',
                '    name: string',
                '    description?: string',
                '  }'
            ]);
        });
    });

    describe('Nullable field handling', () => {
        test('should add | null for nullable fields', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'price',
                    transformedName: 'price',
                    type: new PrimitiveType(PrimitiveKind.NUMBER),
                    required: true,
                    nullable: true
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines).toEqual([
                '  create: {',
                '    price: number | null',
                '  }'
            ]);
        });

        test('should handle optional + nullable fields', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'discount',
                    transformedName: 'discount',
                    type: new PrimitiveType(PrimitiveKind.NUMBER),
                    required: false,
                    nullable: true
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines).toEqual([
                '  create: {',
                '    discount?: number | null',
                '  }'
            ]);
        });

        test('should not add | null for non-nullable fields', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'quantity',
                    transformedName: 'quantity',
                    type: new PrimitiveType(PrimitiveKind.NUMBER),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines).toEqual([
                '  create: {',
                '    quantity: number',
                '  }'
            ]);
        });
    });

    describe('Type conversion', () => {
        test('should convert string primitive type', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'name',
                    transformedName: 'name',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines[1]).toBe('    name: string');
        });

        test('should convert number primitive type', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'count',
                    transformedName: 'count',
                    type: new PrimitiveType(PrimitiveKind.NUMBER),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines[1]).toBe('    count: number');
        });

        test('should convert boolean primitive type', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'active',
                    transformedName: 'active',
                    type: new PrimitiveType(PrimitiveKind.BOOLEAN),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines[1]).toBe('    active: boolean');
        });

        test('should convert datetime to string', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'created_at',
                    transformedName: 'createdAt',
                    type: new PrimitiveType(PrimitiveKind.DATETIME),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines[1]).toBe('    createdAt: string');
        });

        test('should convert reference type', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'user',
                    transformedName: 'user',
                    type: new ReferenceType('App\\Models', 'User'),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines[1]).toBe('    user: User');
        });

        test('should convert array type', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'tags',
                    transformedName: 'tags',
                    type: new ReadonlyCollectionType(
                        CollectionKind.ARRAY,
                        new PrimitiveType(PrimitiveKind.STRING)
                    ),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines[1]).toBe('    tags: Array<string>');
        });

        test('should convert unknown type fallback', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'data',
                    transformedName: 'data',
                    type: new PrimitiveType(PrimitiveKind.UNKNOWN),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines[1]).toBe('    data: unknown');
        });
    });

    describe('Action name normalization', () => {
        test('should lowercase action name', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'id',
                    transformedName: 'id',
                    type: new PrimitiveType(PrimitiveKind.NUMBER),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('CREATE', fields);

            expect(action.lines[0]).toBe('  create: {');
        });

        test('should handle mixed case action names', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'id',
                    transformedName: 'id',
                    type: new PrimitiveType(PrimitiveKind.NUMBER),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('Update', fields);

            expect(action.lines[0]).toBe('  update: {');
        });
    });

    describe('Complex field scenarios', () => {
        test('should handle real-world user registration fields', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'name',
                    transformedName: 'name',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'email',
                    transformedName: 'email',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'password',
                    transformedName: 'password',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'password_confirmation',
                    transformedName: 'passwordConfirmation',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines).toEqual([
                '  create: {',
                '    name: string',
                '    email: string',
                '    password: string',
                '    passwordConfirmation: string',
                '  }'
            ]);
            expect(action.fieldCount).toBe(4);
        });

        test('should handle product form with mixed types', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'name',
                    transformedName: 'name',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'price',
                    transformedName: 'price',
                    type: new PrimitiveType(PrimitiveKind.NUMBER),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'description',
                    transformedName: 'description',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: false,
                    nullable: true
                },
                {
                    originalName: 'in_stock',
                    transformedName: 'inStock',
                    type: new PrimitiveType(PrimitiveKind.BOOLEAN),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines).toEqual([
                '  create: {',
                '    name: string',
                '    price: number',
                '    description?: string | null',
                '    inStock: boolean',
                '  }'
            ]);
        });

        test('should handle cart item fields', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'produk_item_id',
                    transformedName: 'produkItemId',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'qty',
                    transformedName: 'qty',
                    type: new PrimitiveType(PrimitiveKind.NUMBER),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines).toEqual([
                '  create: {',
                '    produkItemId: string',
                '    qty: number',
                '  }'
            ]);
        });
    });

    describe('Metadata validation', () => {
        test('should return correct fieldCount', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'a',
                    transformedName: 'a',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'b',
                    transformedName: 'b',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'c',
                    transformedName: 'c',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.fieldCount).toBe(3);
        });

        test('should return correct line count', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'a',
                    transformedName: 'a',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'b',
                    transformedName: 'b',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            // Header + 2 fields + footer = 4 lines
            expect(action.lines.length).toBe(4);
        });

        test('should return fieldCount 0 for empty fields', () => {
            const action = generator.generateAction('create', []);

            expect(action.fieldCount).toBe(0);
        });
    });

    describe('Edge cases', () => {
        test('should handle field with special characters in transformed name', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'user_id',
                    transformedName: 'userId',
                    type: new PrimitiveType(PrimitiveKind.NUMBER),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines[1]).toBe('    userId: number');
        });

        test('should preserve field order', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'z',
                    transformedName: 'z',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'a',
                    transformedName: 'a',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    originalName: 'm',
                    transformedName: 'm',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ];

            const action = generator.generateAction('create', fields);

            expect(action.lines[1]).toBe('    z: string');
            expect(action.lines[2]).toBe('    a: string');
            expect(action.lines[3]).toBe('    m: string');
        });
    });

    describe('Pure function characteristics', () => {
        test('should be deterministic (same input = same output)', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'name',
                    transformedName: 'name',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ];

            const result1 = generator.generateAction('create', fields);
            const result2 = generator.generateAction('create', fields);

            expect(result1).toEqual(result2);
        });

        test('should not mutate input fields array', () => {
            const fields: RequestField[] = [
                {
                    originalName: 'name',
                    transformedName: 'name',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ];

            const originalFields = [...fields];
            generator.generateAction('create', fields);

            expect(fields).toEqual(originalFields);
        });
    });
});
