/**
 * Compiler Utilities
 * 
 * Core utility classes and functions used throughout the compiler pipeline.
 * 
 * @module compiler/utils
 */

// Relation-native graph model
export {
    type DependencyGraph,
    type DependencyEdge,
    createDependencyGraph,
    addDependency,
    dependencyForward,
    dependencyReverse,
    dependencyNodes,
    dependencyClosure,
    invalidateDependencies,
    stronglyConnectedComponents,
    type GraphUnionFind,
    createGraphUnionFind,
    graphUnionFindUnion
} from './Graph';

// Arena allocators
export {
    Arena,
    ASTArena,
    type ASTNodeId,
    type ASTNodeData
} from './Arena';

// Hashing utilities
export {
    computeStableSymbolId,
    computeIRHash
} from './Hash';
