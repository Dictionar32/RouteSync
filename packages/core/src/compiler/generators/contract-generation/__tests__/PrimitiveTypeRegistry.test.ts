/**
 * PrimitiveTypeRegistry.test.ts
 * 
 * Unit tests for PrimitiveTypeRegistry - Pure transformation logic
 * Tests SemanticType primitive → Zod schema mapping
 */

import { describe, test, expect } from 'vitest';
import { PrimitiveTypeRegistry, PrimitiveNotFoundError } from '../PrimitiveTypeRegistry';
import { PrimitiveType, PrimitiveKind } from '../../../types/SemanticType';

describe('PrimitiveTypeRegistry', () => {
    const registry = new PrimitiveTypeRegistry();

    describe('Basic type mapping', () => {
        test('should map STRING to z.string()', () => {
            const stringType = new PrimitiveType(PrimitiveKind.STRING);
            const schema = registry.getZodSchema(stringType);

            expect(schema).toBe('z.string()');
        });

        test('should map NUMBER to z.number()', () => {
            const numberType = new PrimitiveType(PrimitiveKind.NUMBER);
            const schema = registry.getZodSchema(numberType);

            expect(schema).toBe('z.number()');
        });

        test('should map BOOLEAN to z.boolean()', () => {
            const booleanType = new PrimitiveType(PrimitiveKind.BOOLEAN);
            const schema = registry.getZodSchema(booleanType);

            expect(schema).toBe('z.boolean()');
        });

        test('should map DATETIME to z.string().datetime()', () => {
            const datetimeType = new PrimitiveType(PrimitiveKind.DATETIME);
            const schema = registry.getZodSchema(datetimeType);

            expect(schema).toBe('z.string().datetime()');
        });

        test('should map FILE to an SSR-safe File schema', () => {
            const fileType = new PrimitiveType(PrimitiveKind.FILE);
            const schema = registry.getZodSchema(fileType);

            expect(schema).toBe("z.custom<File>((value) => typeof File !== 'undefined' && value instanceof File)");
        });

        test('should map UNKNOWN to z.unknown()', () => {
            const unknownType = new PrimitiveType(PrimitiveKind.UNKNOWN);
            const schema = registry.getZodSchema(unknownType);

            expect(schema).toBe('z.unknown()');
        });
    });

    describe('Error handling', () => {
        test('should throw PrimitiveNotFoundError for unsupported type', () => {
            // Create a primitive type with unsupported kind by casting
            const unsupportedType = new PrimitiveType('unsupported' as PrimitiveKind);

            expect(() => {
                registry.getZodSchema(unsupportedType);
            }).toThrow(PrimitiveNotFoundError);
        });

        test('should throw error with correct message for unsupported type', () => {
            const unsupportedType = new PrimitiveType('unsupported' as PrimitiveKind);

            expect(() => {
                registry.getZodSchema(unsupportedType);
            }).toThrow('Unsupported primitive type: unsupported');
        });

        test('should include primitive kind in error', () => {
            const unsupportedType = new PrimitiveType('invalid' as PrimitiveKind);

            try {
                registry.getZodSchema(unsupportedType);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error).toBeInstanceOf(PrimitiveNotFoundError);
                expect((error as PrimitiveNotFoundError).primitiveKind).toBe('invalid');
            }
        });
    });

    describe('supports() method', () => {
        test('should return true for STRING type', () => {
            const stringType = new PrimitiveType(PrimitiveKind.STRING);
            expect(registry.supports(stringType)).toBe(true);
        });

        test('should return true for NUMBER type', () => {
            const numberType = new PrimitiveType(PrimitiveKind.NUMBER);
            expect(registry.supports(numberType)).toBe(true);
        });

        test('should return true for BOOLEAN type', () => {
            const booleanType = new PrimitiveType(PrimitiveKind.BOOLEAN);
            expect(registry.supports(booleanType)).toBe(true);
        });

        test('should return true for DATETIME type', () => {
            const datetimeType = new PrimitiveType(PrimitiveKind.DATETIME);
            expect(registry.supports(datetimeType)).toBe(true);
        });

        test('should return true for FILE type', () => {
            const fileType = new PrimitiveType(PrimitiveKind.FILE);
            expect(registry.supports(fileType)).toBe(true);
        });

        test('should return true for UNKNOWN type', () => {
            const unknownType = new PrimitiveType(PrimitiveKind.UNKNOWN);
            expect(registry.supports(unknownType)).toBe(true);
        });

        test('should return false for unsupported type', () => {
            const unsupportedType = new PrimitiveType('unsupported' as PrimitiveKind);
            expect(registry.supports(unsupportedType)).toBe(false);
        });
    });

    describe('Pure function guarantees', () => {
        test('should return same result for same input (idempotent)', () => {
            const stringType = new PrimitiveType(PrimitiveKind.STRING);

            const result1 = registry.getZodSchema(stringType);
            const result2 = registry.getZodSchema(stringType);

            expect(result1).toBe(result2);
        });

        test('should not mutate input', () => {
            const originalType = new PrimitiveType(PrimitiveKind.STRING);
            const typeBefore = originalType.type;

            registry.getZodSchema(originalType);

            expect(originalType.type).toBe(typeBefore);
        });
    });
});
