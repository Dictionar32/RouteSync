/**
 * Relation-backed recursion guard for semantic resolution.
 *
 * Active recursion is represented as a relation membership sequence. The
 * detector exposes semantic entry/exit operations rather than host Set state.
 */
import { relationEqual, relationGate } from './kernel/semanticRelations';
import { relationContains, relationInsert, relationRemove, type RelationMembership } from './kernel/relationMembership';

export interface CycleDetector {
  readonly enter: (nodeId: string) => boolean;
  readonly leave: (nodeId: string) => void;
}

export const createCycleDetector = (): CycleDetector => {
  let visited: RelationMembership<string> = Object.freeze([]);
  return {
    enter: nodeId => relationGate(relationContains(visited, nodeId), () => false, () => { visited = relationInsert(visited, nodeId); return true; }),
    leave: nodeId => { visited = relationRemove(visited, nodeId); },
  };
};
