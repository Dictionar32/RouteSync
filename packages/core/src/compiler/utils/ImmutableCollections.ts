/**
 * @module compiler/types/ImmutableCollections
 * @description Immutable collection types for type-safe data structures
 * 
 * Provides immutable wrappers around Map and Set for use in semantic type system.
 * These collections prevent accidental mutation and provide type-safe APIs.
 */

/**
 * Immutable wrapper around Map providing read-only access.
 * 
 * @template K - Key type
 * @template V - Value type
 * 
 * @example
 * ```typescript
 * const map = new ImmutableMap(new Map([['key', 'value']]));
 * console.log(map.get('key')); // 'value'
 * // map.set('key', 'new') // Error: no set method
 * ```
 */
export class ImmutableMap<K, V> {
    #data: Map<K, V>;

    constructor(source: ReadonlyMap<K, V>) {
        this.#data = new Map(source);
    }

    public get(key: K): V | undefined {
        return this.#data.get(key);
    }

    public entries(): readonly (readonly [K, V])[] {
        return Object.freeze(
            Array.from(this.#data.entries()).map(e => Object.freeze([e[0], e[1]]) as readonly [K, V])
        );
    }
}

/**
 * Immutable wrapper around Set providing read-only access.
 * 
 * @template T - Element type
 * 
 * @example
 * ```typescript
 * const set = new ImmutableSet(new Set(['a', 'b', 'c']));
 * console.log(set.has('a')); // true
 * // set.add('d') // Error: no add method
 * ```
 */
export class ImmutableSet<T> {
    #data: Set<T>;

    constructor(source: ReadonlySet<T>) {
        this.#data = new Set(source);
    }

    public has(value: T): boolean {
        return this.#data.has(value);
    }

    public values(): readonly T[] {
        return Object.freeze(Array.from(this.#data.values()));
    }
}
