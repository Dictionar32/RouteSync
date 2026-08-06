/**
 * Compiler Cache Module
 * 
 * This module provides caching infrastructure for incremental compilation.
 * 
 * Key components:
 * - ArtifactCache: Cache interface for pass outputs
 * - CacheDescriptor: Cache key computation
 * - LRUCache: In-memory LRU cache implementation
 */

export {
    ArtifactCache,
    CacheDescriptor,
    CacheInputDescriptor
} from './ArtifactCache';

export { LRUCache } from './LRUCache';
