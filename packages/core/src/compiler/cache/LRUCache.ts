/**
 * LRUCache.ts
 * 
 * Least-Recently-Used cache implementation.
 */

/**
 * LRU (Least-Recently-Used) cache.
 * 
 * A simple in-memory cache with LRU eviction policy. When the cache reaches
 * its maximum size, the least recently accessed item is evicted.
 * 
 * Usage:
 * ```typescript
 * const cache = new LRUCache<string, number>(100);
 * cache.set('key1', 42);
 * const value = cache.get('key1'); // 42
 * ```
 * 
 * @template K - Key type
 * @template V - Value type
 */
export class LRUCache<K, V> {
    private readonly cache = new Map<K, V>();

    /**
     * Create an LRU cache.
     * 
     * @param max - Maximum number of items to cache
     */
    constructor(private readonly max: number) { }

    /**
     * Get value from cache.
     * 
     * If the key exists, it is moved to the end of the cache (most recently used).
     * 
     * @param key - Cache key
     * @returns Cached value if found, undefined otherwise
     */
    public get(key: K): V | undefined {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }

    /**
     * Store value in cache.
     * 
     * If the cache is full, the least recently used item is evicted.
     * 
     * @param key - Cache key
     * @param value - Value to cache
     */
    public set(key: K, value: V): void {
        // Evict LRU item if cache is full
        if (this.cache.size >= this.max) {
            const iterator = this.cache.keys().next();
            if (!iterator.done) {
                this.cache.delete(iterator.value);
            }
        }
        this.cache.set(key, value);
    }
}
