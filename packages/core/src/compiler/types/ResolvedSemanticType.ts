/**
 * Phase 4A — Structured semantic input for Contract IR.
 *
 * Every discriminator owns the fields required by its variant.
 * Consumers can therefore narrow with a single switch(type.kind).
 */

export type ResolvedPrimitive =
    | 'string'
    | 'number'
    | 'boolean'
    | 'datetime'
    | 'unknown';

export interface ResolvedPrimitiveType {
    readonly kind: 'primitive';
    readonly type: ResolvedPrimitive;
    readonly format?: string;
}

export interface ResolvedResourceType {
    readonly kind: 'resource';
    readonly resource: string;
    readonly collection: boolean;
}

export interface ResolvedModelType {
    readonly kind: 'model';
    readonly model: string;
}

export interface ResolvedObjectType {
    readonly kind: 'object';
    readonly properties: Readonly<Record<string, ResolvedSemanticType>>;
}

export interface ResolvedArrayType {
    readonly kind: 'array';
    readonly items: ResolvedSemanticType;
}

export interface ResolvedUnionType {
    readonly kind: 'union';
    readonly types: readonly [
        ResolvedSemanticType,
        ResolvedSemanticType,
        ...ResolvedSemanticType[],
    ];
}

export interface ResolvedLiteralType {
    readonly kind: 'literal';
    readonly value: string | number | boolean;
}

export type ResolvedSemanticType =
    | ResolvedPrimitiveType
    | ResolvedResourceType
    | ResolvedModelType
    | ResolvedObjectType
    | ResolvedArrayType
    | ResolvedUnionType
    | ResolvedLiteralType;
