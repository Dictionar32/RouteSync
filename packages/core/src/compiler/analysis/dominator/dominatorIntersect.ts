/** Declarative dominator intersection over relation-backed idom facts. */
import { relationIndexLookup, type RelationIndex } from '../../../semantic/kernel/relationMembership';
import { relationOptionFold, relationResolve, relationEqual } from '../../../semantic/kernel/relationalSequence';

const rpoIndex = (rpo: readonly number[], value: number, index = 0): number => relationResolve(
  relationEqual(index, rpo.length),
  () => -1,
  () => relationResolve(
    relationEqual(rpo[index], value),
    () => index,
    () => rpoIndex(rpo, value, index + 1),
  ),
);

export const intersectDominators = (
  first: number,
  second: number,
  rpo: readonly number[],
  idoms: RelationIndex<number, number>,
): number => {
  const step = (left: number, right: number): number => relationResolve(
    relationEqual(left, right),
    () => left,
    () => {
      const leftIndex = rpoIndex(rpo, left);
      const rightIndex = rpoIndex(rpo, right);
      return relationResolve(
        leftIndex > rightIndex,
        () => relationOptionFold(relationIndexLookup(idoms, left), () => left, next => step(next, right)),
        () => relationOptionFold(relationIndexLookup(idoms, right), () => right, next => step(left, next)),
      );
    },
  );
  return step(first, second);
};
