/**
 * catamorphism.ts
 *
 * Discriminated union ADT, frozen specification registry, and pure catamorphism matcher for ResolvedSemanticType.
 *
 * @module compiler/domain/common/resolved-types/catamorphism
 */

import type { ResolvedPrimitiveType } from './base';
import type {
    ResolvedReferenceType,
    ResolvedOptionalType,
    ResolvedNullableType,
    ResolvedCollectionType
} from './wrappers';
import type {
    ResolvedObjectType,
    ResolvedUnionType,
    ResolvedIntersectionType,
    ResolvedUnknownType
} from './compounds';

export type ResolvedSemanticType =
    | ResolvedPrimitiveType
    | ResolvedReferenceType
    | ResolvedOptionalType
    | ResolvedNullableType
    | ResolvedCollectionType
    | ResolvedObjectType
    | ResolvedUnionType
    | ResolvedIntersectionType
    | ResolvedUnknownType;

export const ResolvedSemanticTypeKind = Object.freeze({
    Primitive: 'primitive',
    Reference: 'reference',
    Optional: 'optional',
    Nullable: 'nullable',
    Collection: 'collection',
    Object: 'object',
    Union: 'union',
    Intersection: 'intersection',
    Unknown: 'unknown'
} as const);

export type ResolvedSemanticTypeKind = typeof ResolvedSemanticTypeKind[keyof typeof ResolvedSemanticTypeKind];

export interface ResolvedSemanticTypeSpecification<K extends ResolvedSemanticTypeKind = ResolvedSemanticTypeKind> {
    readonly kind: K;
    readonly isTerminal: boolean;
    readonly isWrapper: boolean;
    readonly isCompound: boolean;
    readonly description: string;
}

export type ResolvedSemanticTypeRegistry = {
    readonly [K in ResolvedSemanticTypeKind]: ResolvedSemanticTypeSpecification<K>;
};

export const RESOLVED_SEMANTIC_TYPE_REGISTRY: ResolvedSemanticTypeRegistry = Object.freeze({
    [ResolvedSemanticTypeKind.Primitive]: {
        kind: ResolvedSemanticTypeKind.Primitive,
        isTerminal: true,
        isWrapper: false,
        isCompound: false,
        description: 'Leaf primitive data type (string, number, boolean, datetime, file, etc.)'
    },
    [ResolvedSemanticTypeKind.Reference]: {
        kind: ResolvedSemanticTypeKind.Reference,
        isTerminal: true,
        isWrapper: false,
        isCompound: false,
        description: 'Named reference to an external entity, DTO, or model contract'
    },
    [ResolvedSemanticTypeKind.Optional]: {
        kind: ResolvedSemanticTypeKind.Optional,
        isTerminal: false,
        isWrapper: true,
        isCompound: false,
        description: 'Unary wrapper marking inner type as optional (can be omitted)'
    },
    [ResolvedSemanticTypeKind.Nullable]: {
        kind: ResolvedSemanticTypeKind.Nullable,
        isTerminal: false,
        isWrapper: true,
        isCompound: false,
        description: 'Unary wrapper marking inner type as nullable (can be null)'
    },
    [ResolvedSemanticTypeKind.Collection]: {
        kind: ResolvedSemanticTypeKind.Collection,
        isTerminal: false,
        isWrapper: true,
        isCompound: false,
        description: 'Unary wrapper representing an ordered collection/array of element types'
    },
    [ResolvedSemanticTypeKind.Object]: {
        kind: ResolvedSemanticTypeKind.Object,
        isTerminal: false,
        isWrapper: false,
        isCompound: true,
        description: 'Compound record structure with ordered named fields'
    },
    [ResolvedSemanticTypeKind.Union]: {
        kind: ResolvedSemanticTypeKind.Union,
        isTerminal: false,
        isWrapper: false,
        isCompound: true,
        description: 'Compound sum/union type of member types'
    },
    [ResolvedSemanticTypeKind.Intersection]: {
        kind: ResolvedSemanticTypeKind.Intersection,
        isTerminal: false,
        isWrapper: false,
        isCompound: true,
        description: 'Compound product/intersection type of member types'
    },
    [ResolvedSemanticTypeKind.Unknown]: {
        kind: ResolvedSemanticTypeKind.Unknown,
        isTerminal: true,
        isWrapper: false,
        isCompound: false,
        description: 'Unresolved or fallback type with diagnostic message'
    }
});

export type ResolvedSemanticTypeVisitor<R> = {
    readonly primitive: (type: ResolvedPrimitiveType) => R;
    readonly reference: (type: ResolvedReferenceType) => R;
    readonly optional: (type: ResolvedOptionalType) => R;
    readonly nullable: (type: ResolvedNullableType) => R;
    readonly collection: (type: ResolvedCollectionType) => R;
    readonly object: (type: ResolvedObjectType) => R;
    readonly union: (type: ResolvedUnionType) => R;
    readonly intersection: (type: ResolvedIntersectionType) => R;
    readonly unknown: (type: ResolvedUnknownType) => R;
};

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik ResolvedSemanticType dengan exhaustive type safety
 */
export function matchResolvedSemanticType<R>(
    type: ResolvedSemanticType,
    visitor: ResolvedSemanticTypeVisitor<R>
): R {
    return visitor[type.kind](type as any);
}
