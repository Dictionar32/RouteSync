/** Relation-backed dominance-frontier facts. */
import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';
import type { DominatorTree } from './dominatorTree';
import { relationContains, relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../semantic/kernel/relationMembership';
import { relationOptionFold, relationFold, relationResolve, relationEqual } from '../../../semantic/kernel/relationalSequence';
import type { RelationOption } from '../../../semantic/kernel/relationFoundation';

export interface DominanceFrontier {
  readonly frontiers: RelationIndex<number, readonly number[]>;
  readonly getFrontier: (blockId: number) => readonly number[];
}

const runnerClosure = (
  runner: number,
  idom: RelationOption<number>,
  blockId: number,
  dom: DominatorTree,
  output: readonly number[],
): readonly number[] => relationOptionFold(
  idom,
  () => output,
  parent => relationResolve(
    relationEqual(runner, parent),
    () => output,
    () => relationResolve(
      relationContains(output, blockId),
      () => output,
      () => relationOptionFold(
        dom.getImmediateDominator(runner),
        () => Object.freeze([...output, blockId]),
        next => relationResolve(relationEqual(next, runner), () => Object.freeze([...output, blockId]), () => runnerClosure(next, dom.getImmediateDominator(next), blockId, dom, Object.freeze([...output, blockId]))),
      ),
    ),
  ),
);

export const createDominanceFrontier = (cfg: ControlFlowGraph, dom: DominatorTree): DominanceFrontier => {
  const blocks = cfg.blocks;
  const seed: RelationIndex<number, readonly number[]> = Object.freeze([]);
  const frontiers = relationFold(
    blocks,
    seed,
    (current, [blockId]) => relationIndexAdd(current, blockId, []),
  );
  const computed = relationFold(
    blocks,
    frontiers,
    (current, [blockId, block]) => relationResolve(
      block.predecessors.length >= 2,
      () => relationFold(
        block.predecessors,
        current,
        (state, predecessor) => relationOptionFold(
          dom.getImmediateDominator(blockId),
          () => state,
          () => {
            const path = runnerClosure(predecessor, dom.getImmediateDominator(predecessor), blockId, dom, []);
            const previous = relationOptionFold(relationIndexLookup(state, predecessor), () => [], value => value);
            return relationIndexAdd(state, predecessor, Object.freeze([...previous, ...path]));
          },
        ),
      ),
      () => current,
    ),
  );
  return Object.freeze({
    frontiers: computed,
    getFrontier: (blockId: number) => relationOptionFold(relationIndexLookup(computed, blockId), () => [], value => value),
  });
};

export const DominanceFrontier = Object.freeze({ compute: createDominanceFrontier });
