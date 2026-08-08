/**
 * ZodModifierBuilder.test.ts
 * 
 * Unit tests for ZodModifierBuilder - Pure string building logic
 * Tests modifier chain generation
 */

import { describe, test, expect } from 'vitest';
import { ZodModifierBuilder, type ModifierConfig } from '../ZodModifierBuilder';

describe('ZodModifierBuilder', () => {
    const builder = new ZodModifierBuilder();

    describe('Basic modifier generation', () => {
        test('should generate no modifiers for required + not nullable', () => {
            const config: ModifierConfig = { required: true, nullable: false };
            const modifiers = builder.buildModifiers(config);

            expect(modifiers).toBe('');
        });

        test('should generate .optional() for optional + not nullable', () => {
            const config: ModifierConfig = { required: false, nullable: false };
            const modifiers = builder.buildModifiers(config);

            expect(modifiers).toBe('.optional()');
        });

        test('should generate .nullable() for required + nullable', () => {
            const config: ModifierConfig = { required: true, nullable: true };
            const modifiers = builder.buildModifiers(config);

            expect(modifiers).toBe('.nullable()');
        });

        test('should generate .nullable().optional() for optional + nullable', () => {
            const config: ModifierConfig = { required: false, nullable: true };
            const modifiers = builder.buildModifiers(config);

            expect(modifiers).toBe('.nullable().optional()');
        });
    });

    describe('hasModifiers() method', () => {
        test('should return false when no modifiers needed (required + not nullable)', () => {
            const config: ModifierConfig = { required: true, nullable: false };
            expect(builder.hasModifiers(config)).toBe(false);
        });

        test('should return true when optional modifier needed', () => {
            const config: ModifierConfig = { required: false, nullable: false };
            expect(builder.hasModifiers(config)).toBe(true);
        });

        test('should return true when nullable modifier needed', () => {
            const config: ModifierConfig = { required: true, nullable: true };
            expect(builder.hasModifiers(config)).toBe(true);
        });

        test('should return true when both modifiers needed', () => {
            const config: ModifierConfig = { required: false, nullable: true };
            expect(builder.hasModifiers(config)).toBe(true);
        });
    });

    describe('Modifier order consistency', () => {
        test('should always put .nullable() before .optional()', () => {
            const config: ModifierConfig = { required: false, nullable: true };
            const modifiers = builder.buildModifiers(config);

            expect(modifiers).toBe('.nullable().optional()');
            expect(modifiers).not.toBe('.optional().nullable()');
        });
    });

    describe('Pure function guarantees', () => {
        test('should return same result for same input (idempotent)', () => {
            const config: ModifierConfig = { required: false, nullable: true };

            const result1 = builder.buildModifiers(config);
            const result2 = builder.buildModifiers(config);

            expect(result1).toBe(result2);
        });

        test('should not mutate input config', () => {
            const config: ModifierConfig = { required: false, nullable: true };
            const originalRequired = config.required;
            const originalNullable = config.nullable;

            builder.buildModifiers(config);

            expect(config.required).toBe(originalRequired);
            expect(config.nullable).toBe(originalNullable);
        });
    });
});
