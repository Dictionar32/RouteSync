/**
 * Compiler Utilities
 * 
 * Core utility classes and functions used throughout the compiler pipeline.
 * 
 * @module compiler/utils
 */

// Relation-native graph model
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
