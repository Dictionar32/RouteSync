/** Immutable relation-backed SSA representation. */

import type { BasicBlockRelation, ControlFlowGraph } from '../../utils/ControlFlowGraph';
import { basicBlockLookup, basicBlockIds, createControlFlowGraph } from '../../utils/ControlFlowGraph';
export type SSABasicBlock = import('../../utils/ControlFlowGraph').BasicBlock;

export interface SSARepresentation {
    readonly entryBlock: number;
    readonly blocks: BasicBlockRelation;
    readonly getBlock: (id: number) => ReturnType<typeof basicBlockLookup>;
    readonly blockIds: readonly number[];
}

export const createSSARepresentation = (cfg: ControlFlowGraph): SSARepresentation => Object.freeze({
    entryBlock: cfg.entryBlock,
    blocks: cfg.blocks,
    getBlock: (id: number) => basicBlockLookup(cfg.blocks, id),
    blockIds: basicBlockIds(cfg.blocks),
});

export const SSARepresentation = Object.freeze({ create: createSSARepresentation });
