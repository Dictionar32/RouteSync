/** Relation-backed dominator tree. */

import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';
import { basicBlockLookup } from '../../utils/ControlFlowGraph';
import { computeRPO } from './dominatorRpo';
import { intersectDominators } from './dominatorIntersect';
import { relationIndexLookup, relationIndexAdd, relationContains, type RelationIndex } from '../../../semantic/foundation/relationMembership';
import { relationOptionFold, relationFold, relationFixedPoint, relationResolve, relationEqual } from '../../../semantic/foundation/relationalSequence';
import type { RelationOption } from '../../../semantic/foundation/relationFoundation';

export interface DominatorTree {
    readonly idoms: RelationIndex<number, number>;
    readonly children: RelationIndex<number, readonly number[]>;
    readonly getImmediateDominator: (blockId: number) => RelationOption<number>;
    readonly getChildren: (blockId: number) => readonly number[];
    readonly dominates: (ancestor: number, descendant: number) => boolean;
}

const processedPredecessors = (cfg: ControlFlowGraph, idoms: RelationIndex<number, number>, blockId: number): readonly number[] => relationOptionFold(
    basicBlockLookup(cfg.blocks, blockId),
    () => [],
    block => relationFold(block.predecessors, [] as readonly number[], (acc, predecessor) => relationOptionFold(relationIndexLookup(idoms, predecessor), () => acc, () => [...acc, predecessor])),
);

const relationIndexEqual = <K, V>(left: RelationIndex<K, V>, right: RelationIndex<K, V>, index = 0): boolean => relationResolve(
    relationEqual(left.length, right.length),
    () => relationResolve(index >= left.length, () => true, () => relationResolve(relationEqual(left[index][0], right[index][0]) && relationEqual(left[index][1], right[index][1]), () => relationIndexEqual(left, right, index + 1), () => false)),
    () => false,
);

const computeIdoms = (cfg: ControlFlowGraph): RelationIndex<number, number> => {
    const rpo = computeRPO(cfg);
    const seed: RelationIndex<number, number> = Object.freeze([[cfg.entryBlock, cfg.entryBlock] as const]);
    const step = (idoms: RelationIndex<number, number>): RelationIndex<number, number> => relationFold(
        rpo,
        idoms,
        (current, blockId) => relationResolve(
            relationEqual(blockId, cfg.entryBlock),
            () => current,
            () => {
                const predecessors = processedPredecessors(cfg, current, blockId);
                return relationResolve(
                    relationEqual(predecessors.length, 0),
                    () => current,
                    () => relationIndexAdd(current, blockId, relationFold(predecessors, predecessors[0], (accumulator, predecessor) => intersectDominators(predecessor, accumulator, rpo, current), 1)),
                );
            },
        ),
    );
    return relationFixedPoint(seed, step, relationIndexEqual).value;
};

const buildChildren = (idoms: RelationIndex<number, number>, entry: number): RelationIndex<number, readonly number[]> => relationFold(
    idoms,
    [] as RelationIndex<number, readonly number[]>,
    (children, pair) => relationResolve(
        relationEqual(pair[0], entry),
        () => children,
        () => relationIndexAdd(children, pair[1], Object.freeze([
            ...relationOptionFold(relationIndexLookup(children, pair[1]), () => [] as readonly number[], value => value),
            pair[0],
        ])),
    ),
);

const dominatesFrom = (idoms: RelationIndex<number, number>, ancestor: number, current: number): boolean => relationResolve(
    relationEqual(current, ancestor),
    () => true,
    () => relationOptionFold(relationIndexLookup(idoms, current), () => false, next => relationResolve(relationEqual(next, current), () => false, () => dominatesFrom(idoms, ancestor, next))),
);

export const createDominatorTree = (cfg: ControlFlowGraph): DominatorTree => {
    const idoms = computeIdoms(cfg);
    const children = buildChildren(idoms, cfg.entryBlock);
    return Object.freeze({
        idoms,
        children,
        getImmediateDominator: (blockId: number) => relationIndexLookup(idoms, blockId),
        getChildren: (blockId: number) => relationOptionFold(relationIndexLookup(children, blockId), () => [], value => value),
        dominates: (ancestor: number, descendant: number) => dominatesFrom(idoms, ancestor, descendant),
    });
};

export const DominatorTree = Object.freeze({ compute: createDominatorTree });
