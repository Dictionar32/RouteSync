/**
 * queryKeyFactory.ts
 *
 * Factory functions for creating strongly typed QueryKeys in Salsa.
 *
 * @module core/compiler/query/salsa/queryKeyFactory
 */

import {
    createMemoizedQueryKey,
    type MemoizedQueryKey,
} from '../TypedCache';
import type { QueryKey } from './salsaTypes';

function createQueryKeyInternal<O>(
    queryName: string,
    targetId: string,
    optionsHash: string,
    cacheRoot: MemoizedQueryKey<O>,
): QueryKey<O> {
    const id = `${queryName}:${targetId}:${optionsHash}`;
    const valueKey = cacheRoot.scope(id);

    return {
        ...valueKey,
        id,
        queryName,
        targetId,
        optionsHash,

        derive: (
            nextTargetId: string,
            nextOptionsHash = optionsHash,
        ) => createQueryKeyInternal(
            queryName,
            nextTargetId,
            nextOptionsHash,
            cacheRoot,
        ),
    };
}

export function createQueryKey<O>(
    queryName: string,
    targetId: string,
    optionsHash: string,
): QueryKey<O> {
    const root = createMemoizedQueryKey<O>(
        `${queryName}:${targetId}:${optionsHash}`,
    );

    return createQueryKeyInternal(
        queryName,
        targetId,
        optionsHash,
        root,
    );
}
