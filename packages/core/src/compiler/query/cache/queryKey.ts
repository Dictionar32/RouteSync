/**
 * queryKey.ts
 *
 * MemoizedQueryKey interface and factory functions.
 *
 * @module core/compiler/query/cache
 */

import { type QueryStorage, type QueryValueStore, createQueryValueStore } from './storage';

export const memoizedQueryBrand: unique symbol = Symbol('memoizedQueryBrand');

export interface MemoizedQueryKey<O> {
  readonly id: string;
  readonly [memoizedQueryBrand]: (value: O) => O;

  read(): O | undefined;
  write(value: O): void;
  hasValue(): boolean;
  deleteValue(): boolean;
  storage(): QueryStorage;
  scope(id: string): MemoizedQueryKey<O>;
}

function createKey<O>(id: string, store: QueryValueStore<O>): MemoizedQueryKey<O> {
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
    scope: (scopedId: string): MemoizedQueryKey<O> => createKey(scopedId, store)
  };
}

export function createMemoizedQueryKey<O>(id: string): MemoizedQueryKey<O> {
  return createKey(id, createQueryValueStore<O>());
}
