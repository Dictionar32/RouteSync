/** Declarative cycle detection for query dependency frames. */
import type { QueryKey, QueryFrame, ActiveQueryFrame } from './salsaTypes';
import { createQueryCycleError } from './salsaTypes';
import { createQueryKey } from './queryKeyFactory';
import { relationContains } from '../../../semantic/kernel/relationMembership';
import { relationGate } from '../../../semantic/kernel/relationalSequence';
import { relationProject } from '../../../semantic/kernel/relationalSequence';

export function assertNoCycle<O>(
  activeQueries: readonly string[],
  activeQueryStack: readonly ActiveQueryFrame[],
  key: QueryKey<O>,
): void {
  const keyId = key.id;
  relationGate(relationContains(activeQueries, keyId), () => { const frames = buildCycleFrames(activeQueryStack, key); throw createQueryCycleError(
    `Query cycle detected: ${[...relationProject(activeQueryStack, frame => frame.keyId), keyId].join(' -> ')}`, frames,
  ); }, () => {});
}

export function buildCycleFrames<O>(
  activeQueryStack: readonly ActiveQueryFrame[],
  key: QueryKey<O>,
): readonly QueryFrame[] {
  return [
    ...relationProject(activeQueryStack, (frame): QueryFrame => ({
      key: createQueryKey<unknown>('query', frame.keyId, 'cycle'),
      queryKind: 'query',
    })),
    {
      key: createQueryKey<unknown>(key.queryName, key.targetId, key.optionsHash),
      queryKind: key.queryName,
      context: { symbolId: key.targetId },
    },
  ];
}
