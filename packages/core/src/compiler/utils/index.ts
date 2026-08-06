/**
 * Compiler Utilities
 * 
 * Core utility classes and functions used throughout the compiler pipeline.
 * 
 * @module compiler/utils
 */

// Data structures
export { FIFOQueue } from './Queue';
export {
    DependencyGraph,
    FrozenSet,
    DependencyGraphBuilder,
    IncrementalInvalidator,
    TarjanSCC,
    UnionFind
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
