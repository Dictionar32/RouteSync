/**
 * ResolvedPhpType sub-domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/types/resolved-php
 */

export {
    PrimitivePhpType,
    EloquentModelPhpType,
    ResourceWrapperPhpType,
    VoidPhpType,
    UnknownPhpType
} from './variants';

export {
    type ResolvedPhpTypeVisitor,
    type ResolvedPhpType,
    matchResolvedPhpType
} from './matcher';
