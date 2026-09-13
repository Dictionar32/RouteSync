/**
 * index.ts
 *
 * Sub-domain exports for typed cache storage and keys.
 *
 * @module core/compiler/query/cache
 */

export {
  type QueryStorage,
  type QueryValueStore,
  createQueryValueStore
} from './storage';
export {
  type MemoizedQueryKey,
  createMemoizedQueryKey
} from './queryKey';
