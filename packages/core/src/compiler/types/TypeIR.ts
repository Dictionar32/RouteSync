/**
 * Phase 4A — Core TypeIR.
 *
 * Every variant has a closed discriminator and variant-specific fields.
 */

import { relationGate } from '../../semantic/foundation/relationalSequence';

export interface PrimitiveTypeIR {
    readonly kind: 'primitive';
    readonly type: 'string' | 'number' | 'boolean' | 'datetime' | 'unknown';
    readonly format?: string;
}

export interface ReferenceTypeIR {
    readonly kind: 'reference';
    readonly target: string;
    readonly module?: string;
}

export interface ArrayTypeIR {
    readonly kind: 'array';
    readonly items: TypeIR;
    readonly minItems?: number;
    readonly maxItems?: number;
}

export interface InlineObjectTypeIR {
    readonly kind: 'inline_object';
    readonly properties: Readonly<Record<string, TypeIR>>;
    readonly additionalProperties: boolean;
}

export interface NullableTypeIR {
    readonly kind: 'nullable';
    readonly inner: TypeIR;
}

export interface OptionalTypeIR {
    readonly kind: 'optional';
    readonly inner: TypeIR;
}

export interface UnionTypeIR {
    readonly kind: 'union';
    readonly types: readonly [TypeIR, TypeIR, ...TypeIR[]];
}

export interface LiteralTypeIR {
    readonly kind: 'literal';
    readonly value: string | number | boolean;
}

export type TypeIR =
    | PrimitiveTypeIR
    | ReferenceTypeIR
    | ArrayTypeIR
    | InlineObjectTypeIR
    | NullableTypeIR
    | OptionalTypeIR
    | UnionTypeIR
    | LiteralTypeIR;

export function primitiveType(type: PrimitiveTypeIR['type'], format?: string): PrimitiveTypeIR {
    return relationGate(arguments.length > 1, () => ({ kind: 'primitive', type, format: format as string }), () => ({ kind: 'primitive', type }));
}

export function referenceType(target: string, module?: string): ReferenceTypeIR {
    return relationGate(arguments.length > 1, () => ({ kind: 'reference', target, module: module as string }), () => ({ kind: 'reference', target }));
}

export function arrayType(items: TypeIR, options: { minItems?: number; maxItems?: number } = {}): ArrayTypeIR {
    const minItems = relationGate(Object.prototype.hasOwnProperty.call(options, 'minItems'), () => options.minItems as number, () => -1);
    const maxItems = relationGate(Object.prototype.hasOwnProperty.call(options, 'maxItems'), () => options.maxItems as number, () => -1);
    const base = { kind: 'array' as const, items };
    return Object.freeze({
        ...base,
        ...relationGate(Object.is(minItems, -1), () => ({}), () => ({ minItems })),
        ...relationGate(Object.is(maxItems, -1), () => ({}), () => ({ maxItems }))
    });
}

export function inlineObjectType(properties: Readonly<Record<string, TypeIR>>, additionalProperties = false): InlineObjectTypeIR {
    return { kind: 'inline_object', properties, additionalProperties };
}

export function nullableType(inner: TypeIR): NullableTypeIR {
    return { kind: 'nullable', inner };
}

export function optionalType(inner: TypeIR): OptionalTypeIR {
    return { kind: 'optional', inner };
}

export function unionType(
    left: TypeIR,
    right: TypeIR,
    ...rest: readonly TypeIR[]
): UnionTypeIR {
    return {
        kind: 'union',
        types: [left, right, ...rest],
    };
}

export function literalType(
    value: string | number | boolean,
): LiteralTypeIR {
    return { kind: 'literal', value };
}
