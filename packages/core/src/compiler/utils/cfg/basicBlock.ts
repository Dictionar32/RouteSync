/**
 * Relation-backed basic blocks and control-flow graph.
 *
 * CFG topology is represented as immutable keyed facts. Construction and
 * lookup are projections over the relation kernel rather than host Map state.
 */

import type { Expression } from './constants';
import type { Instruction } from './instructions';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../semantic/kernel/relationMembership';
import { relationResolve } from '../../../semantic/kernel/relationFoundation';

export interface BasicBlock {
    readonly id: number;
    readonly instructions: readonly (Expression | Instruction)[];
    readonly successors: readonly number[];
    readonly predecessors: readonly number[];
}

export type BasicBlockRelation = RelationIndex<number, BasicBlock>;

export const createBasicBlockRelation = (
    entries: readonly (readonly [number, BasicBlock])[],
    index = 0,
    output: BasicBlockRelation = [],
): BasicBlockRelation => relationResolve(
    index >= entries.length,
    () => Object.freeze(output),
    () => createBasicBlockRelation(entries, index + 1, [...output, Object.freeze(entries[index])]),
);

export const basicBlockLookup = (
    blocks: BasicBlockRelation,
    id: number,
) => relationIndexLookup(blocks, id);

export const basicBlockReplace = (
    blocks: BasicBlockRelation,
    id: number,
    block: BasicBlock,
): BasicBlockRelation => relationIndexAdd(blocks, id, block);

export const basicBlockEntries = (blocks: BasicBlockRelation): BasicBlockRelation => blocks;

export const basicBlockIds = (blocks: BasicBlockRelation, index = 0, output: readonly number[] = []): readonly number[] => relationResolve(
    index >= blocks.length,
    () => Object.freeze(output),
    () => basicBlockIds(blocks, index + 1, [...output, blocks[index][0]]),
);

export interface ControlFlowGraph {
    readonly entryBlock: number;
    readonly exitBlock: number;
    readonly blocks: BasicBlockRelation;
}

export const createControlFlowGraph = (
    entryBlock: number,
    exitBlock: number,
    blocks: BasicBlockRelation,
): ControlFlowGraph => Object.freeze({ entryBlock, exitBlock, blocks });
