/** Relation-backed type-safe memoized query cache. */
import { type QueryStorage, type MemoizedQueryKey, createMemoizedQueryKey } from './cache';
import type { RelationOption } from '../../semantic/foundation/relationFoundation';
import { relationContains } from '../../semantic/foundation/relationMembership';
import { relationFold, relationOptionFold, relationResolve } from '../../semantic/foundation/relationalSequence';

export { type QueryStorage, type MemoizedQueryKey, createMemoizedQueryKey };

export interface TypedCache {
  readonly get: <O>(key: MemoizedQueryKey<O>) => RelationOption<O>;
  readonly set: <O>(key: MemoizedQueryKey<O>, value: O) => void;
  readonly has: <O>(key: MemoizedQueryKey<O>) => boolean;
  readonly delete: <O>(key: MemoizedQueryKey<O>) => boolean;
  readonly size: number;
  readonly clear: () => void;
}

export const createTypedCache = (): TypedCache => {
  let storages: readonly QueryStorage[] = Object.freeze([]);
  return {
    get: key => key.read(),
    set: (key, value) => { key.write(value); storages = relationResolve(relationContains(storages, key.storage()), () => storages, () => Object.freeze([...storages, key.storage()])); },
    has: key => key.hasValue(),
    delete: key => key.deleteValue(),
    get size(): number { return relationFold(storages, 0, (total, storage) => total + storage.size); },
    clear: (): void => { relationFold(storages, false, (_cleared, storage) => { storage.clear(); return true; }); storages = Object.freeze([]); },
  };
};

export interface QueryDescriptor<I, O> {
  readonly key: MemoizedQueryKey<O>;
  readonly inputHash: string;
  readonly compute: (input: I) => O;
}

export interface QueryDatabase {
  readonly executeQuery: <I, O>(query: QueryDescriptor<I, O>, input: I, dependencyFingerprint: string) => O;
  readonly size: number;
  readonly clear: () => void;
}

export const createQueryDatabase = (): QueryDatabase => {
  const cache = createTypedCache();
  return {
    executeQuery: (query, input, dependencyFingerprint) => {
      const cacheId = `${query.key.id}:${query.inputHash}:${dependencyFingerprint}`;
      const cacheKey = query.key.scope(cacheId);
      return relationOptionFold(cache.get(cacheKey),
        () => { const value = query.compute(input); cache.set(cacheKey, value); return value; },
        value => value,
      );
    },
    get size(): number { return cache.size; },
    clear: (): void => cache.clear(),
  };
};
