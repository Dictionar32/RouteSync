/**
 * @fileoverview Type-safe caching mechanism with runtime symbol-based keys
 * @module compiler/query/TypedCache
 */

/**
 * Brand symbol for memoized query keys to ensure type safety
 * @internal
 */
const memoizedQueryBrand = Symbol("memoizedQueryBrand");

/**
 * Type-safe key for memoized query results
 * 
 * @template O Output type of the query
 * 
 * @example
 * ```typescript
 * const userKey = createMemoizedQueryKey<User>('users:123');
 * cache.set(userKey, user);
 * const cached = cache.get(userKey); // Type: User | undefined
 * ```
 */
export interface MemoizedQueryKey<O> {
    readonly id: string;
    readonly [memoizedQueryBrand]: (value: O) => O;
}

/**
 * Creates a type-safe memoized query key
 * 
 * @template O Output type
 * @param id Unique identifier for the query
 * @returns Type-safe query key
 * 
 * @example
 * ```typescript
 * const typeKey = createMemoizedQueryKey<SemanticType>('type:User');
 * ```
 */
export function createMemoizedQueryKey<O>(id: string): MemoizedQueryKey<O> {
    return {
        id,
        [memoizedQueryBrand]: (value: O) => value,
    };
}

/**
 * Type-safe cache with symbol-based runtime keys
 * 
 * Provides type-safe access to cached values while using runtime symbols
 * for storage to avoid key collisions and enable efficient lookups.
 * 
 * @example
 * ```typescript
 * const cache = new TypedCache();
 * const key = createMemoizedQueryKey<number>('count');
 * 
 * cache.set(key, 42);
 * const value = cache.get(key); // Type: number | undefined
 * console.log(cache.has(key)); // true
 * ```
 */
export class TypedCache {
    private store = new Map<symbol, unknown>();
    private keyRegistry = new Map<string, symbol>();

    /**
     * Gets or creates a runtime symbol for a string key
     * 
     * @param id String identifier
     * @returns Runtime symbol for the key
     * @private
     */
    private getOrCreateRuntimeSymbol(id: string): symbol {
        let sym = this.keyRegistry.get(id);
        if (!sym) {
            sym = Symbol(id);
            this.keyRegistry.set(id, sym);
        }
        return sym;
    }

    /**
     * Retrieves a cached value
     * 
     * @template T Type of the cached value
     * @param key Type-safe query key
     * @returns Cached value or undefined if not found
     */
    public get<T>(key: MemoizedQueryKey<T>): T | undefined {
        const sym = this.getOrCreateRuntimeSymbol(key.id);
        return this.store.get(sym) as T | undefined;
    }

    /**
     * Stores a value in the cache
     * 
     * @template T Type of the value
     * @param key Type-safe query key
     * @param value Value to cache
     */
    public set<T>(key: MemoizedQueryKey<T>, value: T): void {
        const sym = this.getOrCreateRuntimeSymbol(key.id);
        this.store.set(sym, value);
    }

    /**
     * Checks if a key exists in the cache
     * 
     * @template T Type of the value
     * @param key Type-safe query key
     * @returns True if the key exists
     */
    public has<T>(key: MemoizedQueryKey<T>): boolean {
        const sym = this.getOrCreateRuntimeSymbol(key.id);
        return this.store.has(sym);
    }

    /**
     * Removes a value from the cache
     * 
     * @template T Type of the value
     * @param key Type-safe query key
     * @returns True if the key was removed
     */
    public delete<T>(key: MemoizedQueryKey<T>): boolean {
        const sym = this.getOrCreateRuntimeSymbol(key.id);
        return this.store.delete(sym);
    }

    /**
     * Clears all cached values
     */
    public clear(): void {
        this.store.clear();
        this.keyRegistry.clear();
    }

    /**
     * Gets the number of cached values
     */
    public get size(): number {
        return this.store.size;
    }
}
