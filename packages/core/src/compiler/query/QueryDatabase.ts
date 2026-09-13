/**
 * @fileoverview Query-based incremental computation database
 * @module compiler/query/QueryDatabase
 */

import { TypedCache, createMemoizedQueryKey } from './TypedCache';
import { type QueryDescriptor, MemoizedQueryDatabase } from './database';

export type { QueryDescriptor };
export { MemoizedQueryDatabase };

export class QueryDatabase {
    private readonly cache = new TypedCache();

    public executeQuery<I, O>(
        query: QueryDescriptor<I, O>,
        input: I,
        dependencyFingerprint: string
    ): O {
        const keyId = `${query.key.id}:${query.inputHash}:${dependencyFingerprint}`;
        const cacheKey = createMemoizedQueryKey<O>(keyId);

        const cached = this.cache.get(cacheKey);
        if (cached !== undefined) {
            return cached;
        }

        const value = query.compute(input);
        this.cache.set(cacheKey, value);

        return value;
    }

    public clear(): void {
        this.cache.clear();
    }

    public getStats(): { size: number } {
        return {
            size: this.cache.size
        };
    }
}
