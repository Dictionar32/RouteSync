import { describe, expect, it } from 'vitest';
import {
    createTypedCache,
    createQueryDatabase,
    createMemoizedQueryKey,
} from '../TypedCache';

describe('TypedCache structured query boundary', () => {
    it('preserves a concrete result type without runtime casts', () => {
        const cache = createTypedCache();
        const key = createMemoizedQueryKey<{ id: number }>('item');
        const value = { id: 7 };

        cache.set(key, value);

        const cached = cache.get(key);

        expect(cached).toEqual({ kind: 'some', value });
        expect(cached.kind).toBe('some');
        expect(cache.has(key)).toBe(true);
    });

    it('keeps scoped keys isolated while preserving their output type', () => {
        const cache = createTypedCache();
        const root = createMemoizedQueryKey<number>('count');
        const first = root.scope('count:revision:1');
        const second = root.scope('count:revision:2');

        cache.set(first, 42);
        cache.set(second, 84);

        expect(cache.get(first)).toEqual({ kind: 'some', value: 42 });
        expect(cache.get(second)).toEqual({ kind: 'some', value: 84 });
    });

    it('supports typed QueryDatabase memoization', () => {
        const database = createQueryDatabase();
        const key = createMemoizedQueryKey<{ value: string }>('query');
        let executions = 0;

        const query = {
            key,
            inputHash: 'input:1',
            compute: (input: string) => {
                executions += 1;
                return { value: input };
            },
        };

        const first = database.executeQuery(query, 'hello', 'deps:1');
        const second = database.executeQuery(query, 'world', 'deps:1');

        expect(first).toEqual({ value: 'hello' });
        expect(second).toEqual({ value: 'hello' });
        expect(executions).toBe(1);
    });
});