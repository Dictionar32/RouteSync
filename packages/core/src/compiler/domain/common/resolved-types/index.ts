/**
 * resolved-types/index.ts
 *
 * Explicit Sub-Domain Exports for Resolved Semantic Types.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/domain/common/resolved-types
 */

export type {
    ResolvedPrimitiveKind,
    ResolvedPrimitiveTypeParams,
    ResolvedReferenceTypeParams,
    ResolvedOptionalTypeParams,
    ResolvedNullableTypeParams,
    ResolvedCollectionTypeParams,
    ObjectKind,
    PlainObjectIdentity,
    ResourceObjectIdentity,
    ModelObjectIdentity,
    ResponseObjectIdentity,
    ResolvedProperty,
    ResolvedObjectIdentity,
    ResolvedObjectTypeParams,
    ResolvedUnionTypeParams,
    ResolvedIntersectionTypeParams,
    ResolvedUnknownTypeParams
} from './types';

export {
    ResolvedSemanticTypeBase,
    ResolvedPrimitiveType
} from './base';

export {
    ResolvedReferenceType,
    ResolvedOptionalType,
    ResolvedNullableType,
    ResolvedCollectionType
} from './wrappers';

export {
    ResolvedObjectType,
    ResolvedUnionType,
    ResolvedIntersectionType,
    ResolvedUnknownType
} from './compounds';

export {
    type ResolvedSemanticType,
    ResolvedSemanticTypeKind,
    type ResolvedSemanticTypeSpecification,
    type ResolvedSemanticTypeRegistry,
    RESOLVED_SEMANTIC_TYPE_REGISTRY,
    type ResolvedSemanticTypeVisitor,
    matchResolvedSemanticType
} from './catamorphism';
