/** Declarative natural-loop detection over CFG relations. */
import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';
import type { DominatorTree } from '../DominatorAnalysis';
import type { LoopInfo, LoopRelations } from './loopTypes';
import { relationContains, relationInsert, type RelationMembership, relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../semantic/kernel/relationMembership';
import { relationFold, relationOptionFold, relationResolve } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/relationFoundation';
import { basicBlockLookup } from '../../utils/ControlFlowGraph';

export function getNaturalLoopBlocks(header: number, backEdges: readonly number[], cfg: ControlFlowGraph): RelationMembership<number> {
    const seed = relationFold(backEdges, relationInsert([] as RelationMembership<number>, header), (blocks, edge) => relationInsert(blocks, edge));
    const expand = (queue: readonly number[], blocks: RelationMembership<number>): RelationMembership<number> => relationResolve(
        relationEqual(queue.length, 0),
        () => Object.freeze(blocks),
        () => {
            const node = queue[0];
            const nextQueue = queue.slice(1);
            return relationOptionFold(
                basicBlockLookup(cfg.blocks, node),
                () => expand(nextQueue, blocks),
                block => {
                    const nextBlocks = relationFold(block.predecessors, blocks, (current, predecessor) => relationInsert(current, predecessor));
                    const added = relationFold(block.predecessors, [] as readonly number[], (queueOutput, predecessor) => relationResolve(relationContains(blocks, predecessor), () => queueOutput, () => [...queueOutput, predecessor]));
                    return expand([...nextQueue, ...added], nextBlocks);
                },
            );
        },
    );
    return expand(backEdges, seed);
}

const collectSuccessorBackEdges = (
    blockId: number,
    successors: readonly number[],
    dom: DominatorTree,
    headers: RelationIndex<number, readonly number[]>,
    index = 0,
): RelationIndex<number, readonly number[]> => relationResolve(
    index >= successors.length,
    () => headers,
    () => {
        const successor = successors[index];
        const next = relationResolve(
            dom.dominates(successor, blockId),
            () => relationIndexAdd(headers, successor, Object.freeze([
                ...relationOptionFold(relationIndexLookup(headers, successor), () => [] as readonly number[], value => value),
                blockId,
            ])),
            () => headers,
        );
        return collectSuccessorBackEdges(blockId, successors, dom, next, index + 1);
    },
);

const collectBackEdges = (
    blocks: RelationIndex<number, import('../../utils/ControlFlowGraph').BasicBlock>,
    dom: DominatorTree,
    index = 0,
    headers: RelationIndex<number, readonly number[]> = [],
): RelationIndex<number, readonly number[]> => relationResolve(
    index >= blocks.length,
    () => headers,
    () => {
        const entry = blocks[index];
        return collectBackEdges(blocks, dom, index + 1, collectSuccessorBackEdges(entry[0], entry[1].successors, dom, headers));
    },
);

export function detectNaturalLoops(cfg: ControlFlowGraph, dom: DominatorTree): readonly LoopInfo[] {
    const backEdges = collectBackEdges(cfg.blocks, dom);
    return relationFold(backEdges, Object.freeze([] as readonly LoopInfo[]), (loops, entry) => [
        ...loops,
        Object.freeze({
            header: entry[0],
            backEdges: entry[1],
            loopBlocks: getNaturalLoopBlocks(entry[0], entry[1], cfg),
        }),
    ]);
}

export const computeLoopRelations = (cfg: ControlFlowGraph, dom: DominatorTree): LoopRelations => ({ loops: detectNaturalLoops(cfg, dom) });
