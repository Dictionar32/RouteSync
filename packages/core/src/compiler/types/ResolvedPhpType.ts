/**
 * ResolvedPhpType.ts
 *
 * Upstream Type Vocabulary Design (TTD) ADT for Resolved PHP Types.
 * Active Consumer: Orchestrates ResolvedPhpType ADT variants and matchers.
 *
 * @module core/compiler/types/ResolvedPhpType
 */

export {
    PrimitivePhpType,
    EloquentModelPhpType,
    ResourceWrapperPhpType,
    VoidPhpType,
    UnknownPhpType,
    type ResolvedPhpTypeVisitor,
    type ResolvedPhpType,
    matchResolvedPhpType
} from './resolved-php';
