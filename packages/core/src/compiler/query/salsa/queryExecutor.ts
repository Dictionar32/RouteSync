/**
 * queryExecutor.ts
 *
 * Core query execution algorithm with caching, cycle detection, and invalidation.
 *
 * @module compiler/query/salsa
 */

import type {
    QueryKey,
    QueryNode,
    ActiveQueryFrame
} from './salsaTypes';
import type { QueryGraphManager } from './queryGraphManager';
import { assertNoCycle } from './cycleDetector';

export function executeSalsaQuery<I, O>(
    graphManager: QueryGraphManager,
    activeQueries: Set<string>,
    activeQueryStack: ActiveQueryFrame[],
    key: QueryKey<O>,
    compute: (input: I) => O,
    input: I,
    currentRevision: number,
): O {
    const keyId = key.id;

    assertNoCycle(activeQueries, activeQueryStack, key);

    const parent = activeQueryStack.at(-1);
    if (parent) {
        graphManager.recordDependency(parent.keyId, keyId);
    }

    const cachedNode = graphManager.getNode(keyId);
    if (
        cachedNode &&
        graphManager.isCacheValid(cachedNode, currentRevision) &&
        key.hasValue()
    ) {
        const cachedValue = key.read();
        if (cachedValue !== undefined) {
            return cachedValue;
        }
    }

    const existingDependents =
        cachedNode?.dependents ?? new Set<string>();

    const node: QueryNode = {
        keyId,
        dependencies: new Set<string>(),
        dependents: new Set(existingDependents),
        lastChangedRevision:
            cachedNode?.lastChangedRevision ?? currentRevision,
        lastVerifiedRevision: currentRevision,
    };

    graphManager.setNode(keyId, node);
    activeQueries.add(keyId);
    activeQueryStack.push({ keyId });

    try {
        const previousValue = key.read();
        const value = compute(input);
        const valueChanged =
            !key.hasValue() ||
            JSON.stringify(previousValue) !== JSON.stringify(value);

        graphManager.setNode(keyId, {
            ...node,
            lastChangedRevision: valueChanged
                ? currentRevision
                : node.lastChangedRevision,
            lastVerifiedRevision: currentRevision,
        });

        key.write(value);

        if (valueChanged) {
            graphManager.invalidateDependents(keyId, currentRevision);
        }

        return value;
    } finally {
        activeQueries.delete(keyId);
        activeQueryStack.pop();
    }
}
