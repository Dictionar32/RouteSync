/**
 * ResolvedSemanticType.ts
 *
 * Active Consumer Orchestrator for Target-Agnostic Structured Domain Value Object Hierarchy.
 * Coordinates primitive, reference, wrapper, compound, and catamorphic semantic types.
 *
 * @module compiler/domain/common
 */

import {
    type ResolvedPrimitiveKind,
    type ResolvedPrimitiveTypeParams,
    type ResolvedReferenceTypeParams,
    type ResolvedOptionalTypeParams,
    type ResolvedNullableTypeParams,
    type ResolvedCollectionTypeParams,
    type ObjectKind,
    type ResolvedField,
    type ResolvedObjectTypeParams,
    type ResolvedUnionTypeParams,
    type ResolvedIntersectionTypeParams,
    type ResolvedUnknownTypeParams,
    ResolvedSemanticTypeBase,
    ResolvedPrimitiveType,
    ResolvedReferenceType,
    ResolvedOptionalType,
    ResolvedNullableType,
    ResolvedCollectionType,
    ResolvedObjectType,
    ResolvedUnionType,
    ResolvedIntersectionType,
    ResolvedUnknownType,
    type ResolvedSemanticType,
    ResolvedSemanticTypeKind,
    type ResolvedSemanticTypeSpecification,
    type ResolvedSemanticTypeRegistry,
    RESOLVED_SEMANTIC_TYPE_REGISTRY,
    type ResolvedSemanticTypeVisitor,
    matchResolvedSemanticType
} from './resolved-types';

// Explicit named re-exports (Rule 14: 0 wildcard re-exports)
export type {
    ResolvedPrimitiveKind,
    ResolvedPrimitiveTypeParams,
    ResolvedReferenceTypeParams,
    ResolvedOptionalTypeParams,
    ResolvedNullableTypeParams,
    ResolvedCollectionTypeParams,
    ObjectKind,
    ResolvedField,
    ResolvedObjectTypeParams,
    ResolvedUnionTypeParams,
    ResolvedIntersectionTypeParams,
    ResolvedUnknownTypeParams,
    ResolvedSemanticType,
    ResolvedSemanticTypeSpecification,
    ResolvedSemanticTypeRegistry,
    ResolvedSemanticTypeVisitor
};

export {
    ResolvedSemanticTypeBase,
    ResolvedPrimitiveType,
    ResolvedReferenceType,
    ResolvedOptionalType,
    ResolvedNullableType,
    ResolvedCollectionType,
    ResolvedObjectType,
    ResolvedUnionType,
    ResolvedIntersectionType,
    ResolvedUnknownType,
    ResolvedSemanticTypeKind,
    RESOLVED_SEMANTIC_TYPE_REGISTRY,
    matchResolvedSemanticType
};