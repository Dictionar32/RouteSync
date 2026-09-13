/**
 * assertionUtils.ts
 *
 * Safe casting, assertion, and diagnostic utilities for runtime type validation.
 *
 * @module core/utils/guards
 */

import { isString, isObject } from './generalGuards';

export function safeCast<T>(
    value: unknown,
    guard: (v: unknown) => v is T,
    fallback: T
): T {
    return guard(value) ? value : fallback;
}

export function safeStringCast(value: unknown, fallback: string = 'unknown'): string {
    return safeCast(value, isString, fallback);
}

export function safeObjectCast(value: unknown, fallback: Record<string, unknown> = {}): Record<string, unknown> {
    return safeCast(value, isObject, fallback);
}

export function assertType<T>(
    value: unknown,
    guard: (v: unknown) => v is T,
    context: string
): T {
    if (!guard(value)) {
        console.warn(`Type assertion failed in ${context}:`, value);
        throw new TypeError(`Expected type in ${context}, got: ${typeof value}`);
    }
    return value;
}

export function softAssertType<T>(
    value: unknown,
    guard: (v: unknown) => v is T,
    fallback: T,
    context: string
): T {
    if (!guard(value)) {
        console.warn(`Type soft-assertion failed in ${context}, using fallback:`, value);
        return fallback;
    }
    return value;
}

export function migrateFromAny<T>(
    value: any,
    guard: (v: unknown) => v is T,
    fallback: T,
    context: string
): T {
    console.warn(`🔧 MIGRATION: Converting 'as any' to type-safe in ${context}`);
    return softAssertType(value, guard, fallback, context);
}

export function inspectType(value: unknown, label: string = 'value'): void {
    console.log(`🔍 Type inspection for ${label}:`, {
        type: typeof value,
        isNull: value === null,
        isUndefined: value === undefined,
        isArray: Array.isArray(value),
        keys: isObject(value) ? Object.keys(value) : 'N/A',
        value: value
    });
}
