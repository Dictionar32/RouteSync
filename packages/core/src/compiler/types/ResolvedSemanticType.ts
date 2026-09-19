/**
 * Compatibility barrel for the legacy compiler boundary.
 * Canonical resolved semantic types live in domain/common/resolved-types.
 */
export type {
    ResolvedSemanticType,
    ResolvedSemanticTypeSpecification,
    ResolvedSemanticTypeRegistry,
    ResolvedSemanticTypeVisitor,
    ResolvedPrimitiveKind
} from '../domain/common/resolved-types';

export {
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
} from '../domain/common/resolved-types';
