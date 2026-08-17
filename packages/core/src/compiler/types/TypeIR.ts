/**
 * Phase 4A — Core TypeIR.
 *
 * Every variant has a closed discriminator and variant-specific fields.
 */

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

export function primitiveType(
    type: PrimitiveTypeIR['type'],
    format?: string,
): PrimitiveTypeIR {
    return format === undefined
        ? { kind: 'primitive', type }
        : { kind: 'primitive', type, format };
}

export function referenceType(
    target: string,
    module?: string,
): ReferenceTypeIR {
    return module === undefined
        ? { kind: 'reference', target }
        : { kind: 'reference', target, module };
}

export function arrayType(
    items: TypeIR,
    options: { minItems?: number; maxItems?: number } = {},
): ArrayTypeIR {
    const { minItems, maxItems } = options;

    return {
        kind: 'array',
        items,
        ...(minItems === undefined ? {} : { minItems }),
        ...(maxItems === undefined ? {} : { maxItems }),
    };
}

export function inlineObjectType(
    properties: Readonly<Record<string, TypeIR>>,
    additionalProperties = false,
): InlineObjectTypeIR {
    return {
        kind: 'inline_object',
        properties,
        additionalProperties,
    };
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
