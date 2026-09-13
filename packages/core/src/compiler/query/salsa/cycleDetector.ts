/**
 * cycleDetector.ts
 *
 * Cycle detection and frame reconstruction for query dependency chains.
 *
 * @module core/compiler/query/salsa
 */

import { type QueryKey, type QueryFrame, QueryCycleError, createQueryKey, type ActiveQueryFrame } from './queryTypes';

export function assertNoCycle<O>(
  activeQueries: ReadonlySet<string>,
  activeQueryStack: readonly ActiveQueryFrame[],
  key: QueryKey<O>
): void {
  const keyId = key.id;
  if (activeQueries.has(keyId)) {
    const frames = buildCycleFrames(activeQueryStack, key);
    throw new QueryCycleError(
      `Query cycle detected: ${[
        ...activeQueryStack.map((frame) => frame.keyId),
        keyId,
      ].join(' -> ')}`,
      frames
    );
  }
}

export function buildCycleFrames<O>(
  activeQueryStack: readonly ActiveQueryFrame[],
  key: QueryKey<O>
): readonly QueryFrame[] {
  const frames = activeQueryStack.map(
    (frame): QueryFrame => ({
      key: createQueryKey<unknown>('query', frame.keyId, 'cycle'),
      queryKind: 'query',
    })
  );

  return [
    ...frames,
    {
      key: createQueryKey<unknown>(key.queryName, key.targetId, key.optionsHash),
      queryKind: key.queryName,
      context: { symbolId: key.targetId },
    },
  ];
}
