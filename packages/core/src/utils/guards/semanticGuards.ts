/**
 * semanticGuards.ts
 *
 * Semantic type guards for RouteSync AST and IR nodes.
 *
 * @module core/utils/guards
 */

import { isObject, hasProperty, isString, isNumber, isBoolean, isArray } from './generalGuards';

export interface TypeWithKind {
    kind: string;
    [key: string]: unknown;
}

export function hasKind(value: unknown): value is TypeWithKind {
    return isObject(value) && hasProperty(value, 'kind') && isString(value.kind);
}

export function isPrimitiveType(value: unknown): value is {
    kind: 'primitive';
    type: string;
    format?: string;
} {
    return hasKind(value) &&
        value.kind === 'primitive' &&
        hasProperty(value, 'type') &&
        isString(value.type);
}

export function isResourceType(value: unknown): value is {
    kind: 'resource';
    resource: string;
    collection?: boolean;
} {
    return hasKind(value) &&
        value.kind === 'resource' &&
        hasProperty(value, 'resource') &&
        isString(value.resource);
}

export function isModelType(value: unknown): value is {
    kind: 'model';
    model: string;
} {
    return hasKind(value) &&
        value.kind === 'model' &&
        hasProperty(value, 'model') &&
        isString(value.model);
}

export function isObjectType(value: unknown): value is {
    kind: 'object';
    properties?: Record<string, unknown>;
} {
    return hasKind(value) && value.kind === 'object';
}

export function isArrayType(value: unknown): value is {
    kind: 'array';
    items: unknown;
} {
    return hasKind(value) &&
        value.kind === 'array' &&
        hasProperty(value, 'items');
}

export function isUnionType(value: unknown): value is {
    kind: 'union';
    types: unknown[];
} {
    return hasKind(value) &&
        value.kind === 'union' &&
        hasProperty(value, 'types') &&
        isArray(value.types);
}

export function isLiteralType(value: unknown): value is {
    kind: 'literal';
    value: string | number | boolean;
} {
    return hasKind(value) &&
        value.kind === 'literal' &&
        hasProperty(value, 'value') &&
        (isString(value.value) || isNumber(value.value) || isBoolean(value.value));
}

/**
 * Laravel validation rules guard
 *
 * Memastikan value adalah flat map { fieldName: ruleString | ruleString[] },
 * persis bentuk asli Laravel FormRequest::rules().
 */
export function isRulesMap(value: unknown): value is Record<string, string | string[]> {
    return isObject(value) &&
        Object.values(value).every(
            (v) => isString(v) || (isArray(v) && v.every(isString))
        );
}

export function isNullableType(value: unknown): value is {
    kind: 'nullable';
    inner: unknown;
} {
    return hasKind(value) &&
        value.kind === 'nullable' &&
        hasProperty(value, 'inner');
}

export function isOptionalType(value: unknown): value is {
    kind: 'optional';
    inner: unknown;
} {
    return hasKind(value) &&
        value.kind === 'optional' &&
        hasProperty(value, 'inner');
}
