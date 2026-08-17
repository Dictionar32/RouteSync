/**
 * @fileoverview Type-safe memoized query cache.
 *
 * Query values stay associated with their MemoizedQueryKey<O>.
 * The cache never needs a Map<string, unknown> or a generic result assertion.
 */

const memoizedQueryBrand: unique symbol = Symbol('memoizedQueryBrand');

export interface QueryStorage {
    readonly size: number;
    clear(): void;
}

interface QueryValueStore<O> extends QueryStorage {
    read(id: string): O | undefined;
    write(id: string, value: O): void;
    has(id: string): boolean;
    remove(id: string): boolean;
}

function createQueryValueStore<O>(): QueryValueStore<O> {
    const values = new Map<string, O>();

    return {
        read: (id: string): O | undefined => values.get(id),

        write: (id: string, value: O): void => {
            values.set(id, value);
        },

        has: (id: string): boolean => values.has(id),

        remove: (id: string): boolean => values.delete(id),

        get size(): number {
            return values.size;
        },

        clear: (): void => {
            values.clear();
        },
    };
}

export interface MemoizedQueryKey<O> {
    readonly id: string;
    readonly [memoizedQueryBrand]: (value: O) => O;

    read(): O | undefined;
    write(value: O): void;
    hasValue(): boolean;
    deleteValue(): boolean;

    /**
     * Returns the typed storage handle owned by this key.
     *
     * Derived/scoped keys share the same storage while retaining O.
     */
    storage(): QueryStorage;

    /**
     * Derive a new runtime identity while preserving O.
     */
    scope(id: string): MemoizedQueryKey<O>;
}

function createKey<O>(
    id: string,
    store: QueryValueStore<O>,
): MemoizedQueryKey<O> {
    return {
        id,

        [memoizedQueryBrand]: (value: O): O => value,

        read: (): O | undefined => store.read(id),

        write: (value: O): void => {
            store.write(id, value);
        },

        hasValue: (): boolean => store.has(id),

        deleteValue: (): boolean => store.remove(id),

        storage: (): QueryStorage => store,

        scope: (scopedId: string): MemoizedQueryKey<O> =>
            createKey(scopedId, store),
    };
}

export function createMemoizedQueryKey<O>(
    id: string,
): MemoizedQueryKey<O> {
    return createKey(id, createQueryValueStore<O>());
}

/**
 * Typed cache facade.
 *
 * The cache tracks storage handles, never erased values.
 */
export class TypedCache {
    private readonly storages = new Set<QueryStorage>();

    public get<O>(key: MemoizedQueryKey<O>): O | undefined {
        return key.read();
    }

    public set<O>(
        key: MemoizedQueryKey<O>,
        value: O,
    ): void {
        key.write(value);
        this.storages.add(key.storage());
    }

    public has<O>(key: MemoizedQueryKey<O>): boolean {
        return key.hasValue();
    }

    public delete<O>(key: MemoizedQueryKey<O>): boolean {
        return key.deleteValue();
    }

    /**
     * Number of values currently stored across all registered typed stores.
     */
    public get size(): number {
        let total = 0;

        for (const storage of this.storages) {
            total += storage.size;
        }

        return total;
    }

    /**
     * Clears every registered typed store.
     */
    public clear(): void {
        for (const storage of this.storages) {
            storage.clear();
        }

        this.storages.clear();
    }
}

export interface QueryDescriptor<I, O> {
    readonly key: MemoizedQueryKey<O>;
    readonly inputHash: string;
    readonly compute: (input: I) => O;
}

export class QueryDatabase {
    private readonly cache = new TypedCache();

    public executeQuery<I, O>(
        query: QueryDescriptor<I, O>,
        input: I,
        dependencyFingerprint: string,
    ): O {
        const cacheId =
            `${query.key.id}:${query.inputHash}:${dependencyFingerprint}`;

        const cacheKey = query.key.scope(cacheId);
        const cached = this.cache.get(cacheKey);

        if (this.cache.has(cacheKey) && cached !== undefined) {
            return cached;
        }

        const value = query.compute(input);
        this.cache.set(cacheKey, value);

        return value;
    }

    public get size(): number {
        return this.cache.size;
    }

    public clear(): void {
        this.cache.clear();
    }
}