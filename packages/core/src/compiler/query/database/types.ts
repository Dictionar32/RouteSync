/**
 * types.ts
 *
 * QueryDescriptor interface for query computation.
 *
 * @module core/compiler/query/database
 */

import type { MemoizedQueryKey } from '../TypedCache';

export interface QueryDescriptor<I, O> {
  readonly key: MemoizedQueryKey<O>;
  readonly inputHash: string;
  compute(input: I): O;
}
