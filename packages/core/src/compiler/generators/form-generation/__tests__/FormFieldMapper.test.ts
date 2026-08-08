/**
 * FormFieldMapper.test.ts
 * 
 * Unit tests for FormFieldMapper - Pure transformation logic
 * Tests validation rule → TypeScript type mapping
 */

import { describe, test, expect } from 'vitest';
import { FormFieldMapper, type ValidationRule } from '../FormFieldMapper';
import { PrimitiveType, PrimitiveKind } from '../../../types/SemanticType';

describe('FormFieldMapper', () => {
    const mapper = new FormFieldMapper();

    describe('Basic type mapping', () => {
        test('should map string rule to STRING type', () => {
            const rules: ValidationRule[] = [{ rule: 'string' }];
            const result = mapper.mapValidationToType(rules);

            expect(result.type).toBeInstanceOf(PrimitiveType);
            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.STRING);
            expect(result.required).toBe(false);
            expect(result.nullable).toBe(false);
        });

        test('should map integer rule to NUMBER type', () => {
            const rules: ValidationRule[] = [{ rule: 'integer' }];
            const result = mapper.mapValidationToType(rules);

            expect(result.type).toBeInstanceOf(PrimitiveType);
            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.NUMBER);
        });

        test('should map numeric rule to NUMBER type', () => {
            const rules: ValidationRule[] = [{ rule: 'numeric' }];
            const result = mapper.mapValidationToType(rules);

            expect(result.type).toBeInstanceOf(PrimitiveType);
            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.NUMBER);
        });

        test('should map boolean rule to BOOLEAN type', () => {
            const rules: ValidationRule[] = [{ rule: 'boolean' }];
            const result = mapper.mapValidationToType(rules);

            expect(result.type).toBeInstanceOf(PrimitiveType);
            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.BOOLEAN);
        });

        test('should map date rule to DATETIME type', () => {
            const rules: ValidationRule[] = [{ rule: 'date' }];
            const result = mapper.mapValidationToType(rules);

            expect(result.type).toBeInstanceOf(PrimitiveType);
            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.DATETIME);
        });

        test('should map date_format rule to DATETIME type', () => {
            const rules: ValidationRule[] = [
                { rule: 'date_format', parameters: ['Y-m-d'] }
            ];
            const result = mapper.mapValidationToType(rules);

            expect(result.type).toBeInstanceOf(PrimitiveType);
            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.DATETIME);
        });

        test('should map array rule to STRING type (default array element)', () => {
            const rules: ValidationRule[] = [{ rule: 'array' }];
            const result = mapper.mapValidationToType(rules);

            expect(result.type).toBeInstanceOf(PrimitiveType);
            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.STRING);
        });

        test('should map json rule to STRING type', () => {
            const rules: ValidationRule[] = [{ rule: 'json' }];
            const result = mapper.mapValidationToType(rules);

            expect(result.type).toBeInstanceOf(PrimitiveType);
            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.STRING);
        });

        test('should default to STRING type when no type rule', () => {
            const rules: ValidationRule[] = [{ rule: 'max', parameters: ['255'] }];
            const result = mapper.mapValidationToType(rules);

            expect(result.type).toBeInstanceOf(PrimitiveType);
            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.STRING);
        });
    });

    describe('Required and nullable flags', () => {
        test('should set required flag from required rule', () => {
            const rules: ValidationRule[] = [
                { rule: 'required' },
                { rule: 'string' }
            ];
            const result = mapper.mapValidationToType(rules);

            expect(result.required).toBe(true);
            expect(result.nullable).toBe(false);
        });

        test('should set nullable flag from nullable rule', () => {
            const rules: ValidationRule[] = [
                { rule: 'nullable' },
                { rule: 'string' }
            ];
            const result = mapper.mapValidationToType(rules);

            expect(result.required).toBe(false);
            expect(result.nullable).toBe(true);
        });

        test('should handle both required and nullable', () => {
            const rules: ValidationRule[] = [
                { rule: 'required' },
                { rule: 'nullable' },
                { rule: 'string' }
            ];
            const result = mapper.mapValidationToType(rules);

            expect(result.required).toBe(true);
            expect(result.nullable).toBe(true);
        });

        test('should default to not required and not nullable', () => {
            const rules: ValidationRule[] = [{ rule: 'string' }];
            const result = mapper.mapValidationToType(rules);

            expect(result.required).toBe(false);
            expect(result.nullable).toBe(false);
        });
    });

    describe('Combined validation rules', () => {
        test('should handle required string with max length', () => {
            const rules: ValidationRule[] = [
                { rule: 'required' },
                { rule: 'string' },
                { rule: 'max', parameters: ['255'] }
            ];
            const result = mapper.mapValidationToType(rules);

            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.STRING);
            expect(result.required).toBe(true);
            expect(result.nullable).toBe(false);
        });

        test('should handle nullable integer with min value', () => {
            const rules: ValidationRule[] = [
                { rule: 'nullable' },
                { rule: 'integer' },
                { rule: 'min', parameters: ['1'] }
            ];
            const result = mapper.mapValidationToType(rules);

            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.NUMBER);
            expect(result.required).toBe(false);
            expect(result.nullable).toBe(true);
        });

        test('should handle email validation (string type)', () => {
            const rules: ValidationRule[] = [
                { rule: 'required' },
                { rule: 'string' },
                { rule: 'email' }
            ];
            const result = mapper.mapValidationToType(rules);

            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.STRING);
            expect(result.required).toBe(true);
        });

        test('should handle unique validation (type unchanged)', () => {
            const rules: ValidationRule[] = [
                { rule: 'required' },
                { rule: 'string' },
                { rule: 'unique', parameters: ['users', 'email'] }
            ];
            const result = mapper.mapValidationToType(rules);

            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.STRING);
            expect(result.required).toBe(true);
        });

        test('should handle confirmed validation (type unchanged)', () => {
            const rules: ValidationRule[] = [
                { rule: 'required' },
                { rule: 'string' },
                { rule: 'confirmed' }
            ];
            const result = mapper.mapValidationToType(rules);

            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.STRING);
            expect(result.required).toBe(true);
        });
    });

    describe('Unknown and edge case rules', () => {
        test('should ignore unknown rules', () => {
            const rules: ValidationRule[] = [
                { rule: 'unknown_rule' },
                { rule: 'string' }
            ];
            const result = mapper.mapValidationToType(rules);

            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.STRING);
        });

        test('should handle empty rules array', () => {
            const rules: ValidationRule[] = [];
            const result = mapper.mapValidationToType(rules);

            expect(result.type).toBeInstanceOf(PrimitiveType);
            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.STRING);
            expect(result.required).toBe(false);
            expect(result.nullable).toBe(false);
        });

        test('should handle rules in any order', () => {
            const rules: ValidationRule[] = [
                { rule: 'max', parameters: ['255'] },
                { rule: 'required' },
                { rule: 'email' },
                { rule: 'string' }
            ];
            const result = mapper.mapValidationToType(rules);

            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.STRING);
            expect(result.required).toBe(true);
        });
    });

    describe('Type overriding behavior', () => {
        test('should use last type rule when multiple type rules', () => {
            const rules: ValidationRule[] = [
                { rule: 'string' },
                { rule: 'integer' } // This should win
            ];
            const result = mapper.mapValidationToType(rules);

            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.NUMBER);
        });

        test('should handle multiple required flags (idempotent)', () => {
            const rules: ValidationRule[] = [
                { rule: 'required' },
                { rule: 'required' },
                { rule: 'string' }
            ];
            const result = mapper.mapValidationToType(rules);

            expect(result.required).toBe(true);
        });

        test('should handle multiple nullable flags (idempotent)', () => {
            const rules: ValidationRule[] = [
                { rule: 'nullable' },
                { rule: 'nullable' },
                { rule: 'string' }
            ];
            const result = mapper.mapValidationToType(rules);

            expect(result.nullable).toBe(true);
        });
    });

    describe('Real-world Laravel validation scenarios', () => {
        test('should handle typical user registration field', () => {
            const rules: ValidationRule[] = [
                { rule: 'required' },
                { rule: 'string' },
                { rule: 'max', parameters: ['255'] },
                { rule: 'unique', parameters: ['users', 'email'] }
            ];
            const result = mapper.mapValidationToType(rules);

            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.STRING);
            expect(result.required).toBe(true);
            expect(result.nullable).toBe(false);
        });

        test('should handle optional price field', () => {
            const rules: ValidationRule[] = [
                { rule: 'nullable' },
                { rule: 'numeric' },
                { rule: 'min', parameters: ['0'] }
            ];
            const result = mapper.mapValidationToType(rules);

            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.NUMBER);
            expect(result.required).toBe(false);
            expect(result.nullable).toBe(true);
        });

        test('should handle boolean checkbox field', () => {
            const rules: ValidationRule[] = [
                { rule: 'boolean' }
            ];
            const result = mapper.mapValidationToType(rules);

            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.BOOLEAN);
            expect(result.required).toBe(false);
        });

        test('should handle date of birth field', () => {
            const rules: ValidationRule[] = [
                { rule: 'required' },
                { rule: 'date' },
                { rule: 'before', parameters: ['today'] }
            ];
            const result = mapper.mapValidationToType(rules);

            expect((result.type as PrimitiveType).type).toBe(PrimitiveKind.DATETIME);
            expect(result.required).toBe(true);
        });
    });
});
