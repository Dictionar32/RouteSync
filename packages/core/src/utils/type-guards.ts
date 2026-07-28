/**
 * Type Guards Utility
 * 
 * Koleksi type guard functions untuk mengurangi penggunaan 'as any'
 * dan meningkatkan type safety di seluruh proyek RouteSync.
 * 
 * PHILOSOPHY:
 * - Lebih baik explicit type checking daripada silent type casting
 * - Setiap 'as any' harus memiliki alasan yang jelas dan fallback yang aman
 * - Type guards memberikan runtime safety dan compile-time type narrowing
 */

/**
 * General-purpose type guards
 */
export function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object'
}

export function hasProperty<K extends string>(
    obj: unknown,
    prop: K
): obj is Record<K, unknown> {
    return isObject(obj) && prop in obj
}

export function isString(value: unknown): value is string {
    return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value)
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean'
}

export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value)
}

/**
 * Semantic Type Guards untuk mengganti SemanticType casting
 */
export interface TypeWithKind {
    kind: string
    [key: string]: unknown
}

export function hasKind(value: unknown): value is TypeWithKind {
    return isObject(value) && hasProperty(value, 'kind') && isString(value.kind)
}

export function isPrimitiveType(value: unknown): value is {
    kind: 'primitive'
    type: string
    format?: string
} {
    return hasKind(value) &&
        value.kind === 'primitive' &&
        hasProperty(value, 'type') &&
        isString(value.type)
}

export function isResourceType(value: unknown): value is {
    kind: 'resource'
    resource: string
    collection?: boolean
} {
    return hasKind(value) &&
        value.kind === 'resource' &&
        hasProperty(value, 'resource') &&
        isString(value.resource)
}

export function isModelType(value: unknown): value is {
    kind: 'model'
    model: string
} {
    return hasKind(value) &&
        value.kind === 'model' &&
        hasProperty(value, 'model') &&
        isString(value.model)
}

export function isObjectType(value: unknown): value is {
    kind: 'object'
    properties?: Record<string, unknown>
} {
    return hasKind(value) && value.kind === 'object'
}

export function isArrayType(value: unknown): value is {
    kind: 'array'
    items: unknown
} {
    return hasKind(value) &&
        value.kind === 'array' &&
        hasProperty(value, 'items')
}

export function isUnionType(value: unknown): value is {
    kind: 'union'
    types: unknown[]
} {
    return hasKind(value) &&
        value.kind === 'union' &&
        hasProperty(value, 'types') &&
        isArray(value.types)
}

export function isLiteralType(value: unknown): value is {
    kind: 'literal'
    value: string | number | boolean
} {
    return hasKind(value) &&
        value.kind === 'literal' &&
        hasProperty(value, 'value') &&
        (isString(value.value) || isNumber(value.value) || isBoolean(value.value))
}

/**
 * TypeIR Guards untuk emitter type checking
 */
export function isNullableType(value: unknown): value is {
    kind: 'nullable'
    inner: unknown
} {
    return hasKind(value) &&
        value.kind === 'nullable' &&
        hasProperty(value, 'inner')
}

export function isOptionalType(value: unknown): value is {
    kind: 'optional'
    inner: unknown
} {
    return hasKind(value) &&
        value.kind === 'optional' &&
        hasProperty(value, 'inner')
}

/**
 * Safe casting utilities dengan fallback
 */
export function safeCast<T>(
    value: unknown,
    guard: (v: unknown) => v is T,
    fallback: T
): T {
    return guard(value) ? value : fallback
}

export function safeStringCast(value: unknown, fallback: string = 'unknown'): string {
    return safeCast(value, isString, fallback)
}

export function safeObjectCast(value: unknown, fallback: Record<string, unknown> = {}): Record<string, unknown> {
    return safeCast(value, isObject, fallback)
}

/**
 * Advanced type checking dengan logging
 */
export function assertType<T>(
    value: unknown,
    guard: (v: unknown) => v is T,
    context: string
): T {
    if (!guard(value)) {
        console.warn(`Type assertion failed in ${context}:`, value)
        throw new TypeError(`Expected type in ${context}, got: ${typeof value}`)
    }
    return value
}

export function softAssertType<T>(
    value: unknown,
    guard: (v: unknown) => v is T,
    fallback: T,
    context: string
): T {
    if (!guard(value)) {
        console.warn(`Type soft-assertion failed in ${context}, using fallback:`, value)
        return fallback
    }
    return value
}

/**
 * Utility untuk migration dari 'as any' ke type-safe approach
 */
export function migrateFromAny<T>(
    value: any, // Temporary during migration
    guard: (v: unknown) => v is T,
    fallback: T,
    context: string
): T {
    console.warn(`🔧 MIGRATION: Converting 'as any' to type-safe in ${context}`)
    return softAssertType(value, guard, fallback, context)
}

/**
 * Debugging utilities
 */
export function inspectType(value: unknown, label: string = 'value'): void {
    console.log(`🔍 Type inspection for ${label}:`, {
        type: typeof value,
        isNull: value === null,
        isUndefined: value === undefined,
        isArray: Array.isArray(value),
        keys: isObject(value) ? Object.keys(value) : 'N/A',
        value: value
    })
}