/**
 * ArtifactCache.ts
 * 
 * Defines artifact caching interfaces for incremental compilation.
 */

import type { ArtifactKey } from '../artifacts/types';

/**
 * Cache input descriptor.
 * Describes a single input artifact for cache key computation.
 */
export interface CacheInputDescriptor {
    /**
     * Artifact key of the input.
     */
    readonly artifactKey: ArtifactKey;

    /**
     * Hash of the input artifact content.
     */
    readonly inputHash: string;
}

/**
 * Cache descriptor.
 * Uniquely identifies a cached pass execution result.
 * 
 * The cache descriptor includes all factors that affect pass output:
 * - Pass name
 * - Input artifact hashes
 * - Compiler version
 * - Compiler options hash
 */
export interface CacheDescriptor {
    /**
     * Name of the pass that produced the cached result.
     */
    readonly passName: string;

    /**
     * Descriptors of input artifacts.
     */
    readonly inputs: readonly CacheInputDescriptor[];

    /**
     * Compiler version used to produce the result.
     */
    readonly compilerVersion: string;

    /**
     * Hash of compiler options used to produce the result.
     */
    readonly optionsHash: string;
}

/**
 * ArtifactCache interface.
 * 
 * Provides caching for compiler pass outputs to enable incremental compilation.
 * Implementations can use in-memory, file system, or distributed caching.
 * 
 * Cache keys are based on:
 * - Pass name
 * - Input artifact hashes
 * - Compiler version
 * - Compiler options
 * 
 * Usage:
 * ```typescript
 * const cache: ArtifactCache = new LRUCache(1000);
 * 
 * const descriptor = {
 *   passName: 'TypeCheck',
 *   inputs: [{ artifactKey: 'AST', inputHash: 'abc123' }],
 *   compilerVersion: '6.1.0',
 *   optionsHash: 'def456'
 * };
 * 
 * // Check cache
 * const cached = cache.get<TypeEnvironmentArtifact>(descriptor);
 * if (cached) {
 *   return cached;
 * }
 * 
 * // Compute and cache
 * const result = computeExpensiveResult();
 * cache.set(descriptor, result);
 * ```
 */
export interface ArtifactCache {
    /**
     * Get cached artifact.
     * 
     * @param descriptor - Cache descriptor
     * @returns Cached artifact if found, undefined otherwise
     * @template T - Type of the cached artifact
     */
    get<T>(descriptor: CacheDescriptor): T | undefined;

    /**
     * Store artifact in cache.
     * 
     * @param descriptor - Cache descriptor
     * @param artifact - Artifact to cache
     * @template T - Type of the artifact
     */
    set<T>(descriptor: CacheDescriptor, artifact: T): void;
}
