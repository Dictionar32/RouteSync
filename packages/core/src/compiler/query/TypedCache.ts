/**
 * @fileoverview Type-safe memoized query cache.
 *
 * Query values stay associated with their MemoizedQueryKey<O>.
 * The cache never needs a Map<string, unknown> or a generic result assertion.
 */

import {
    type QueryStorage,
    type MemoizedQueryKey,
    createMemoizedQueryKey
} from './cache';

export {
    type QueryStorage,
    type MemoizedQueryKey,
    createMemoizedQueryKey
};

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

    public get size(): number {
        let total = 0;
        for (const storage of this.storages) {
            total += storage.size;
        }
        return total;
    }

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
