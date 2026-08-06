/**
 * @module compiler/types
 * @description Semantic type system for RouteSync compiler
 * 
 * Provides the complete type system used throughout semantic analysis:
 * 
 * ## Core Types
 * - **SemanticType**: Main type union
 * - **PrimitiveType**: Basic scalar types (string, number, boolean, datetime, unknown)
 * - **ReferenceType**: Named types from Laravel models/resources
 * - **CollectionType**: Arrays, nullable types
 * - **GenericType**: Parameterized types with variance
 * - **ObjectType**: Structural object types
 * - **UnionType/IntersectionType**: Composite types
 * 
 * ## Type Operations
 * - **TypeHasher**: Deterministic hash computation with cycle detection
 * - **TypeInterner**: Type deduplication for memory efficiency
 * - **TypeSystem**: Join/meet operations, subtyping, assignability
 * - **TypeHierarchy**: Interface for inheritance queries
 * 
 * ## Immutable Collections
 * - **ImmutableMap**: Immutable key-value store
 * - **ImmutableSet**: Immutable value set
 * 
 * @example
 * ```typescript
 * import {
 *   PrimitiveType,
 *   PrimitiveKind,
 *   ReferenceType,
 *   TypeSystem,
 *   TypeInterner
 * } from './compiler/types';
 * 
 * // Create types
 * const stringType = new PrimitiveType(PrimitiveKind.STRING);
 * const userType = new ReferenceType('App\\Models', 'User');
 * 
 * // Intern for deduplication
 * const interner = new TypeInterner();
 * const canonical = interner.intern(stringType);
 * 
 * // Type operations
 * const typeSystem = new TypeSystem(hierarchy);
 * const union = typeSystem.join(stringType, numberType);
 * const isSubtype = typeSystem.isSubtype(adminType, userType);
 * ```
 */

// Core semantic types
export {
    PrimitiveKind,
    CollectionKind,
    SemanticTypeBase,
    PrimitiveType,
    NeverType,
    ErrorType,
    ReferenceType,
    UnionType,
    IntersectionType,
    ReadonlyCollectionType,
    MutableCollectionType,
    GenericVariance,
    GenericParameter,
    GenericType,
    ObjectType,
    SemanticType
} from './SemanticType';

// Immutable collections
export {
    ImmutableMap,
    ImmutableSet
} from '../utils/ImmutableCollections';

// Type hashing
export {
    HashContext,
    TypeHasher
} from './TypeHasher';

// Type interning
export {
    TypeInterner
} from './TypeInterner';

// Type hierarchy
export {
    TypeHierarchy
} from './TypeHierarchy';

// Type system operations
export {
    TypeSystem
} from './TypeSystem';

// File spans and source locations
export {
    FileSpan,
    SourceRange,
    ASTBaseNode
} from './FileSpan';

// Source location utilities
export {
    LineMap,
    spanToRange,
    rangeToSpan,
    spanEnd,
    spanContains,
    compareSpans,
    mergeSpans
} from '../utils/SourceLocation';
