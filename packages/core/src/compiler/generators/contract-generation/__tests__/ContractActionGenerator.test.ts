/**
 * ContractActionGenerator.test.ts
 * 
 * Test suite for ContractActionGenerator
 */

import { describe, test, expect } from 'vitest';
import { ContractActionGenerator } from '../ContractActionGenerator';
import { PrimitiveType, PrimitiveKind, ObjectType, ReadonlyCollectionType } from '../../../types/SemanticType';
import { ImmutableMap, ImmutableSet } from '../../../utils/ImmutableCollections';

describe('ContractActionGenerator', () => {
    const generator = new ContractActionGenerator();

    describe('Basic action generation', () => {
        test('should generate basic action block', () => {
            const action = generator.generateAction('create', [
                {
                    name: 'nama',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    name: 'email',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ]);

            expect(action.name).toBe('create');
            expect(action.fieldCount).toBe(2);
            expect(action.schemaLines).toContain('  create: z.object({');
            expect(action.schemaLines).toContain('    nama: z.string(),');
            expect(action.schemaLines).toContain('    email: z.string()');
            expect(action.schemaLines).toContain('  })');
        });

        test('should handle empty fields', () => {
            const action = generator.generateAction('create', []);

            expect(action.name).toBe('create');
            expect(action.fieldCount).toBe(0);
            expect(action.schemaLines).toEqual(['  create: z.object({})']);
            expect(action.typeLines).toEqual(['  create: {}']);
        });

        test('should handle single field', () => {
            const action = generator.generateAction('update', [
                {
                    name: 'status',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ]);

            expect(action.fieldCount).toBe(1);
            expect(action.schemaLines).toContain('    status: z.string()');
        });
    });

    describe('Multiple fields', () => {
        test('should handle multiple fields', () => {
            const action = generator.generateAction('create', [
                {
                    name: 'nama',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    name: 'qty',
                    type: new PrimitiveType(PrimitiveKind.NUMBER),
                    required: true,
                    nullable: false
                },
                {
                    name: 'active',
                    type: new PrimitiveType(PrimitiveKind.BOOLEAN),
                    required: true,
                    nullable: false
                }
            ]);

            expect(action.fieldCount).toBe(3);
            expect(action.schemaLines).toContain('    nama: z.string(),');
            expect(action.schemaLines).toContain('    qty: z.number(),');
            expect(action.schemaLines).toContain('    active: z.boolean()');
        });
    });

    describe('Optional and nullable fields', () => {
        test('should handle optional fields', () => {
            const action = generator.generateAction('update', [
                {
                    name: 'description',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: false,
                    nullable: false
                }
            ]);

            expect(action.schemaLines).toContain('    description: z.string().optional()');
            // Type line includes field but check without comma
            const typeLine = action.typeLines.find(line => line.includes('description'));
            expect(typeLine).toBeDefined();
            expect(typeLine).toContain('string | undefined');
        });

        test('should handle nullable fields', () => {
            const action = generator.generateAction('create', [
                {
                    name: 'notes',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: true
                }
            ]);

            expect(action.schemaLines).toContain('    notes: z.string().nullable()');
            const typeLine = action.typeLines.find(line => line.includes('notes'));
            expect(typeLine).toBeDefined();
            expect(typeLine).toContain('string | null');
        });

        test('should handle optional nullable fields', () => {
            const action = generator.generateAction('update', [
                {
                    name: 'metadata',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: false,
                    nullable: true
                }
            ]);

            expect(action.schemaLines).toContain('    metadata: z.string().nullable().optional()');
            const typeLine = action.typeLines.find(line => line.includes('metadata'));
            expect(typeLine).toBeDefined();
            expect(typeLine).toContain('string | null | undefined');
        });
    });

    describe('Complex types', () => {
        test('should handle nested objects', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['city', new PrimitiveType(PrimitiveKind.STRING)],
                    ['postal_code', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['city', 'postal_code']))
            );

            const action = generator.generateAction('create', [
                {
                    name: 'address',
                    type: objectType,
                    required: true,
                    nullable: false
                }
            ]);

            expect(action.schemaLines[1]).toContain('address: z.object({');
        });

        test('should handle arrays', () => {
            const arrayType = new ReadonlyCollectionType(
                new PrimitiveType(PrimitiveKind.STRING)
            );

            const action = generator.generateAction('create', [
                {
                    name: 'tags',
                    type: arrayType,
                    required: true,
                    nullable: false
                }
            ]);

            expect(action.schemaLines[1]).toContain('tags: z.array(');
        });
    });

    describe('Formatting', () => {
        test('should preserve field order', () => {
            const action = generator.generateAction('create', [
                {
                    name: 'first',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    name: 'second',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    name: 'third',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ]);

            const fieldIndex1 = action.schemaLines.findIndex(line => line.includes('first'));
            const fieldIndex2 = action.schemaLines.findIndex(line => line.includes('second'));
            const fieldIndex3 = action.schemaLines.findIndex(line => line.includes('third'));

            expect(fieldIndex1).toBeLessThan(fieldIndex2);
            expect(fieldIndex2).toBeLessThan(fieldIndex3);
        });

        test('should preserve snake_case', () => {
            const action = generator.generateAction('create', [
                {
                    name: 'produk_item_id',
                    type: new PrimitiveType(PrimitiveKind.NUMBER),
                    required: true,
                    nullable: false
                },
                {
                    name: 'shipping_address',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ]);

            expect(action.schemaLines).toContain('    produk_item_id: z.number(),');
            expect(action.schemaLines).toContain('    shipping_address: z.string()');
        });

        test('should have proper indentation', () => {
            const action = generator.generateAction('create', [
                {
                    name: 'field',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ]);

            // Check indentation levels
            expect(action.schemaLines[0]).toMatch(/^  /);  // 2 spaces for action
            expect(action.schemaLines[1]).toMatch(/^    /); // 4 spaces for field
        });

        test('should have proper comma placement', () => {
            const action = generator.generateAction('create', [
                {
                    name: 'first',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                },
                {
                    name: 'last',
                    type: new PrimitiveType(PrimitiveKind.STRING),
                    required: true,
                    nullable: false
                }
            ]);

            // First field should have comma
            expect(action.schemaLines[1]).toMatch(/,$/);
            // Last field should not have comma
            expect(action.schemaLines[2]).not.toMatch(/,$/);
        });
    });
});
