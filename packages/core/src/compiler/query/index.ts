/**
 * @fileoverview Query system for incremental computation
 * @module compiler/query
 * 
 * Provides incremental computation infrastructure based on Salsa framework:
 * - Type-safe caching with MemoizedQueryKey
 * - Query cells for tracking computation state
 * - Query databases with dependency tracking
 * - Salsa compiler for demand-driven incremental compilation
 */

// Query Cell
export type { QueryCell } from './QueryCell';
export {
    createPendingCell,
    createReadyCell,
    isReady,
    isPending,
    addDependency
} from './QueryCell';

// Typed Cache
export type { MemoizedQueryKey } from './TypedCache';
export {
    TypedCache,
    createMemoizedQueryKey
} from './TypedCache';

// Query Database
export type { QueryDescriptor } from './QueryDatabase';
export {
    QueryDatabase,
    MemoizedQueryDatabase
} from './QueryDatabase';

// Salsa Compiler
export type {
    QueryKey,
    QueryNode,
    QueryContext,
    QueryFrame,
    
} from './SalsaCompiler';
export {
    SalsaCompiler,
    QueryCycleError
} from './SalsaCompiler';
