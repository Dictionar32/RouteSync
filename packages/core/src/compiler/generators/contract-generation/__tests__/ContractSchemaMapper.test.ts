/**
 * ContractSchemaMapper.test.ts
 * 
 * Unit tests for ContractSchemaMapper
 * Tests SemanticType → Zod schema mapping
 */

import { describe, test, expect } from 'vitest';
import { ContractSchemaMapper, type FieldConfig } from '../ContractSchemaMapper';
import { PrimitiveTypeRegistry } from '../PrimitiveTypeRegistry';
import { ZodModifierBuilder } from '../ZodModifierBuilder';
import {
    PrimitiveType,
    PrimitiveKind,
    ObjectType,
    ReadonlyCollectionType,
    CollectionKind,
    UnionType,
    ReferenceType
} from '../../../types/SemanticType';
import { ImmutableMap, ImmutableSet } from '../../../utils/ImmutableCollections';

describe('ContractSchemaMapper', () => {
    const mapper = new ContractSchemaMapper(
        new PrimitiveTypeRegistry(),
        new ZodModifierBuilder()
    );

    describe('Primitive type mapping', () => {
        test('should map STRING type to z.string()', () => {
            const type = new PrimitiveType(PrimitiveKind.STRING);
            const config: FieldConfig = {
                fieldName: 'nama',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(type, config);

            expect(result.zodSchema).toBe('z.string()');
            expect(result.needsImport).toBe(true);
            expect(result.referencedTypes).toEqual([]);
        });

        test('should map NUMBER type to z.number()', () => {
            const type = new PrimitiveType(PrimitiveKind.NUMBER);
            const config: FieldConfig = {
                fieldName: 'qty',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(type, config);

            expect(result.zodSchema).toBe('z.number()');
        });

        test('should map BOOLEAN type to z.boolean()', () => {
            const type = new PrimitiveType(PrimitiveKind.BOOLEAN);
            const config: FieldConfig = {
                fieldName: 'active',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(type, config);

            expect(result.zodSchema).toBe('z.boolean()');
        });

        test('should map DATETIME type to z.string().datetime()', () => {
            const type = new PrimitiveType(PrimitiveKind.DATETIME);
            const config: FieldConfig = {
                fieldName: 'created_at',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(type, config);

            expect(result.zodSchema).toBe('z.string().datetime()');
        });

        test('should map FILE type without eagerly reading the browser File global', () => {
            const type = new PrimitiveType(PrimitiveKind.FILE);
            const config: FieldConfig = {
                fieldName: 'avatar',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(type, config);

            expect(result.zodSchema).toBe("z.custom<File>((value) => typeof File !== 'undefined' && value instanceof File)");
        });
    });

    describe('Modifier application', () => {
        test('should add .optional() for optional field', () => {
            const type = new PrimitiveType(PrimitiveKind.STRING);
            const config: FieldConfig = {
                fieldName: 'description',
                required: false,
                nullable: false
            };

            const result = mapper.mapToZodSchema(type, config);

            expect(result.zodSchema).toBe('z.string().optional()');
        });

        test('should add .nullable() for nullable field', () => {
            const type = new PrimitiveType(PrimitiveKind.NUMBER);
            const config: FieldConfig = {
                fieldName: 'price',
                required: true,
                nullable: true
            };

            const result = mapper.mapToZodSchema(type, config);

            expect(result.zodSchema).toBe('z.number().nullable()');
        });

        test('should add .nullable().optional() for optional nullable field', () => {
            const type = new PrimitiveType(PrimitiveKind.STRING);
            const config: FieldConfig = {
                fieldName: 'notes',
                required: false,
                nullable: true
            };

            const result = mapper.mapToZodSchema(type, config);

            expect(result.zodSchema).toBe('z.string().nullable().optional()');
        });
    });

    describe('Object type mapping', () => {
        test('should map object with nested fields', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['nama', new PrimitiveType(PrimitiveKind.STRING)],
                    ['telepon', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['nama', 'telepon']))
            );

            const config: FieldConfig = {
                fieldName: 'shipping',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(objectType, config);

            expect(result.zodSchema).toBe('z.object({ nama: z.string(), telepon: z.string() })');
        });

        test('should map empty object', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map()),
                new ImmutableSet(new Set())
            );

            const config: FieldConfig = {
                fieldName: 'empty',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(objectType, config);

            expect(result.zodSchema).toBe('z.object({})');
        });

        test('should handle optional fields in object', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['nama', new PrimitiveType(PrimitiveKind.STRING)],
                    ['telepon', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['nama'])) // Only nama is required
            );

            const config: FieldConfig = {
                fieldName: 'contact',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(objectType, config);

            expect(result.zodSchema).toContain('nama: z.string()');
            expect(result.zodSchema).toContain('telepon: z.string().optional()');
        });
    });

    describe('Array type mapping', () => {
        test('should map array of primitives', () => {
            const arrayType = new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                new PrimitiveType(PrimitiveKind.NUMBER)
            );

            const config: FieldConfig = {
                fieldName: 'produk_item_ids',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(arrayType, config);

            expect(result.zodSchema).toBe('z.array(z.number())');
        });

        test('should map array of objects', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['name', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['id', 'name']))
            );

            const arrayType = new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                objectType
            );

            const config: FieldConfig = {
                fieldName: 'items',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(arrayType, config);

            expect(result.zodSchema).toContain('z.array(z.object({');
            expect(result.zodSchema).toContain('id: z.number()');
            expect(result.zodSchema).toContain('name: z.string()');
        });
    });

    describe('Union type mapping', () => {
        test('should map union of primitives', () => {
            const unionType = new UnionType(
                new ImmutableSet(new Set([
                    new PrimitiveType(PrimitiveKind.STRING),
                    new PrimitiveType(PrimitiveKind.NUMBER)
                ]))
            );

            const config: FieldConfig = {
                fieldName: 'value',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(unionType, config);

            expect(result.zodSchema).toBe('z.string().or(z.number())');
        });

        test('should handle empty union', () => {
            const unionType = new UnionType(
                new ImmutableSet(new Set())
            );

            const config: FieldConfig = {
                fieldName: 'never',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(unionType, config);

            expect(result.zodSchema).toBe('z.unknown()');
        });

        test('should handle single member union', () => {
            const unionType = new UnionType(
                new ImmutableSet(new Set([
                    new PrimitiveType(PrimitiveKind.STRING)
                ]))
            );

            const config: FieldConfig = {
                fieldName: 'single',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(unionType, config);

            expect(result.zodSchema).toBe('z.string()');
        });
    });

    describe('Reference type mapping', () => {
        test('should map reference type to z.unknown()', () => {
            const refType = new ReferenceType('App\\Models', 'User');

            const config: FieldConfig = {
                fieldName: 'user',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(refType, config);

            expect(result.zodSchema).toBe('z.unknown()');
            expect(result.referencedTypes).toEqual(['User']);
        });
    });

    describe('Referenced types tracking', () => {
        test('should track referenced types in objects', () => {
            const refType = new ReferenceType('App\\Models', 'User');
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['user', refType]
                ])),
                new ImmutableSet(new Set(['user']))
            );

            const config: FieldConfig = {
                fieldName: 'data',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(objectType, config);

            expect(result.referencedTypes).toContain('User');
        });

        test('should track referenced types in arrays', () => {
            const refType = new ReferenceType('App\\Models', 'Product');
            const arrayType = new ReadonlyCollectionType(
                CollectionKind.ARRAY,
                refType
            );

            const config: FieldConfig = {
                fieldName: 'products',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(arrayType, config);

            expect(result.referencedTypes).toContain('Product');
        });
    });

    describe('Edge cases', () => {
        test('should handle deeply nested objects', () => {
            const innerObject = new ObjectType(
                new ImmutableMap(new Map([
                    ['city', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['city']))
            );

            const outerObject = new ObjectType(
                new ImmutableMap(new Map([
                    ['address', innerObject]
                ])),
                new ImmutableSet(new Set(['address']))
            );

            const config: FieldConfig = {
                fieldName: 'location',
                required: true,
                nullable: false
            };

            const result = mapper.mapToZodSchema(outerObject, config);

            expect(result.zodSchema).toContain('address: z.object({');
            expect(result.zodSchema).toContain('city: z.string()');
        });
    });

    describe('Pure function guarantees', () => {
        test('should return same result for same input (idempotent)', () => {
            const type = new PrimitiveType(PrimitiveKind.STRING);
            const config: FieldConfig = {
                fieldName: 'test',
                required: true,
                nullable: false
            };

            const result1 = mapper.mapToZodSchema(type, config);
            const result2 = mapper.mapToZodSchema(type, config);

            expect(result1.zodSchema).toBe(result2.zodSchema);
        });
    });
});
