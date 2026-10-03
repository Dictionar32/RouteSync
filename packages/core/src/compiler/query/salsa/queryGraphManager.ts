/** Relation-backed dependency graph and cache invalidation engine. */
import type { QueryNode } from './salsaTypes';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../semantic/kernel/relationMembership';
import { relationOptionFold, relationResolve, relationFold } from '../../../semantic/kernel/relationalSequence';
import { relationEqual, relationNotEqual } from '../../../semantic/kernel/relationFoundation';
import { relationContains, relationInsert } from '../../../semantic/kernel/relationMembership';
import type { RelationOption } from '../../../semantic/kernel/relationFoundation';

export interface QueryGraphManager {
  readonly getNode: (keyId: string) => RelationOption<QueryNode>;
  readonly setNode: (keyId: string, node: QueryNode) => void;
  readonly isCacheValid: (node: QueryNode, currentRevision: number) => boolean;
  readonly recordDependency: (parentId: string, childId: string) => void;
  readonly invalidateDependents: (keyId: string, revision: number) => void;
  readonly size: number;
  readonly clear: () => void;
}

export function createQueryGraphManager(): QueryGraphManager {
  let graph: RelationIndex<string, QueryNode> = Object.freeze([]);

  const getNode = (keyId: string): RelationOption<QueryNode> => relationIndexLookup(graph, keyId);
  const setNode = (keyId: string, node: QueryNode): void => { graph = relationIndexAdd(graph, keyId, node); };
  const isCacheValid = (node: QueryNode, currentRevision: number): boolean => relationResolve(
    relationNotEqual(node.lastVerifiedRevision, currentRevision),
    () => false,
    () => node.dependencies.every(dependencyId => relationOptionFold(
      getNode(dependencyId),
      () => false,
      dependency => dependency.lastChangedRevision <= node.lastVerifiedRevision,
    )),
  );

  const recordDependency = (parentId: string, childId: string): void => {
    relationOptionFold(getNode(parentId), () => {}, parentNode => setNode(parentId, {
      ...parentNode,
      dependencies: relationInsert(parentNode.dependencies, childId),
    }));
    relationOptionFold(getNode(childId), () => {}, childNode => setNode(childId, {
      ...childNode,
      dependents: relationInsert(childNode.dependents, parentId),
    }));
  };

  const invalidate = (queue: readonly string[], visited: readonly string[], revision: number): void => relationResolve(
    relationEqual(queue.length, 0),
    () => {},
    () => {
      const current = queue[0];
      const nextQueue = queue.slice(1);
      return relationResolve(relationContains(visited, current),
        () => invalidate(nextQueue, visited, revision),
        () => relationOptionFold(getNode(current),
          () => invalidate(nextQueue, relationInsert(visited, current), revision),
          node => {
            const nextVisited = relationInsert(visited, current);
            const next = relationFold(node.dependents, nextQueue, (items, dependentId) => relationOptionFold(
              getNode(dependentId),
              () => items,
              () => relationResolve(relationContains(nextVisited, dependentId), () => items, () => [...items, dependentId]),
            ));
            relationFold(node.dependents, false, (changed, dependentId) => relationOptionFold(getNode(dependentId), () => changed, dependent => { setNode(dependentId, { ...dependent, lastVerifiedRevision: revision - 1 }); return true; }));
            return invalidate(next, nextVisited, revision);
          }),
      );
    },
  );

  return {
    getNode,
    setNode,
    isCacheValid,
    recordDependency,
    invalidateDependents: (keyId, revision) => invalidate([keyId], [], revision),
    get size(): number { return graph.length; },
    clear: () => { graph = Object.freeze([]); },
  };
}
