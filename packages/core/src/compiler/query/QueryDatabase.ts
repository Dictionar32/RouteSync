/** Query database facade backed by the relation-native typed cache. */
import { type QueryDescriptor, type QueryDatabase as QueryDatabaseContract, createQueryDatabase } from './TypedCache';
export type { QueryDescriptor };
export type QueryDatabase = QueryDatabaseContract;
export { createQueryDatabase };
