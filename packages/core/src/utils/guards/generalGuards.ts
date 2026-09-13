/**
 * generalGuards.ts
 *
 * General-purpose JavaScript / TypeScript primitive type guards.
 *
 * @module core/utils/guards
 */

export function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object';
}

export function hasProperty<K extends string>(
    obj: unknown,
    prop: K
): obj is Record<K, unknown> {
    return isObject(obj) && prop in obj;
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}
