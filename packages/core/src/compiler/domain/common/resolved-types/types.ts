/**
 * types.ts
 *
 * Parameter contracts and vocabulary for ResolvedSemanticType domain hierarchy.
 *
 * @module compiler/domain/common/resolved-types/types
 */

import type { ResolvedSemanticType } from './catamorphism';

export type ResolvedPrimitiveKind =
    | 'string'
    | 'number'
    | 'boolean'
    | 'datetime'
    | 'file'
    | 'unknown';

export interface ResolvedPrimitiveTypeParams {
    readonly primitiveKind: ResolvedPrimitiveKind;
}

export interface ResolvedReferenceTypeParams {
    readonly name: string;
    readonly namespace: string | null;
}

export interface ResolvedOptionalTypeParams {
    readonly innerType: ResolvedSemanticType;
}

export interface ResolvedNullableTypeParams {
    readonly innerType: ResolvedSemanticType;
}

export interface ResolvedCollectionTypeParams {
    readonly elementType: ResolvedSemanticType;
}

export type ObjectKind = 'resource' | 'model' | 'response' | 'plain';

export type ResolvedField = readonly [name: string, type: ResolvedSemanticType];

export interface ResolvedObjectTypeParams {
    readonly fields: readonly ResolvedField[];
    readonly objectKind: ObjectKind;
    readonly resourceName: string | null;
    readonly typeName: string | null;
}

export interface ResolvedUnionTypeParams {
    readonly members: readonly ResolvedSemanticType[];
}

export interface ResolvedIntersectionTypeParams {
    readonly members: readonly ResolvedSemanticType[];
}

export interface ResolvedUnknownTypeParams {
    readonly diagnosticMessage: string;
}
