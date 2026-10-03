/** Query database facade backed by the relation-native typed cache. */
import { type QueryDescriptor, type QueryDatabase as QueryDatabaseContract, createQueryDatabase } from './TypedCache';
import { createMemoizedQueryDatabase, type MemoizedQueryDatabase } from './database';
export type { QueryDescriptor };
export { createMemoizedQueryDatabase };
export type { MemoizedQueryDatabase };
export type QueryDatabase = QueryDatabaseContract;
export { createQueryDatabase };
