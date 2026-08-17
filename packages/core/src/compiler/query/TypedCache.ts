/**
 * @fileoverview Type-safe memoized query cache.
 *
 * The cache deliberately does not own heterogeneous unknown storage.
 * Each MemoizedQueryKey owns a typed storage map and exposes only typed
 * operations. TypedCache is therefore a small typed facade over those keys.
 */

const memoizedQueryBrand: unique symbol = Symbol('memoizedQueryBrand');

interface QueryValueStore<O> {
    readonly read: (id: string) => O | undefined;
    readonly write: (id: string, value: O) => void;
    readonly has: (id: string) => boolean;
    readonly remove: (id: string) => boolean;
}

function createQueryValueStore<O>(): QueryValueStore<O> {
    const values = new Map<string, O>();

    return {
        read: (id) => values.get(id),

        write: (id, value) => {
            values.set(id, value);
        },

        has: (id) => values.has(id),

        remove: (id) => values.delete(id),
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
     * Derive a new runtime identity while preserving the same output type.
     * Derived keys share the same typed storage map.
     */
    scope(id: string): MemoizedQueryKey<O>;
}

function createKey<O>(
    id: string,
    store: QueryValueStore<O>,
): MemoizedQueryKey<O> {
    return {
        id,
        [memoizedQueryBrand]: (value: O) => value,

        read: () => store.read(id),

        write: (value: O) => {
            store.write(id, value);
        },

        hasValue: () => store.has(id),

        deleteValue: () => store.remove(id),

        scope: (scopedId: string) => createKey(scopedId, store),
    };
}

export function createMemoizedQueryKey<O>(
    id: string,
): MemoizedQueryKey<O> {
    return createKey(id, createQueryValueStore<O>());
}

export class TypedCache {
    public get<O>(key: MemoizedQueryKey<O>): O | undefined {
        return key.read();
    }

    public set<O>(key: MemoizedQueryKey<O>, value: O): void {
        key.write(value);
    }

    public has<O>(key: MemoizedQueryKey<O>): boolean {
        return key.hasValue();
    }

    public delete<O>(key: MemoizedQueryKey<O>): boolean {
        return key.deleteValue();
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
}
