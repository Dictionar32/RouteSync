/**
 * @module compiler/types/TypeInterner
 * @description Type interning for deduplication and memory efficiency
 * 
 * The TypeInterner maintains a cache of all types seen during compilation,
 * ensuring that structurally identical types share the same instance.
 * This provides:
 * - Memory efficiency (no duplicate type objects)
 * - Fast equality checking (reference equality)
 * - Consistent type identity across compilation
 */

import { SemanticType } from './SemanticType';
import { TypeHasher, HashContext } from './TypeHasher';

/**
 * Type interner for deduplication.
 * 
 * Maintains a global cache of types keyed by their structural hash.
 * Ensures that structurally identical types are represented by the same instance.
 * 
 * @example
 * ```typescript
 * const interner = new TypeInterner();
 * 
 * const type1 = new PrimitiveType(PrimitiveKind.STRING);
 * const type2 = new PrimitiveType(PrimitiveKind.STRING);
 * 
 * const interned1 = interner.intern(type1);
 * const interned2 = interner.intern(type2);
 * 
 * // Reference equality - same instance
 * console.log(interned1 === interned2); // true
 * ```
 */
export class TypeInterner {
    private cache = new Map<string, SemanticType>();

    /**
     * Intern a semantic type.
     * 
     * If a structurally identical type has been seen before, returns the cached instance.
     * Otherwise, caches the new type and returns it.
     * 
     * @param type - Type to intern
     * @returns Canonical instance of the type
     */
    public intern(type: SemanticType): SemanticType {
        // Compute structural hash
        const ctx: HashContext = {
            activeStack: [],
            finalized: new WeakMap()
        };
        const hash = TypeHasher.hash(type, ctx);

        // Check cache
        let cached = this.cache.get(hash);
        if (!cached) {
            // First time seeing this type - cache it
            cached = type;
            this.cache.set(hash, type);
        }

        return cached;
    }

    /**
     * Get cache size for debugging/monitoring.
     * 
     * @returns Number of unique types cached
     */
    public getCacheSize(): number {
        return this.cache.size;
    }

    /**
     * Clear the cache.
     * Should only be used between compilation sessions.
     */
    public clear(): void {
        this.cache.clear();
    }
}
