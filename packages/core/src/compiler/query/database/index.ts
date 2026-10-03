/**
 * index.ts
 *
 * Sub-domain exports for query database.
 *
 * @module core/compiler/query/database
 */

export type { QueryDescriptor } from './types';
export { createMemoizedQueryDatabase, type MemoizedQueryDatabase } from './memoizedDatabase';
