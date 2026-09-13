/**
 * basicBlock.ts
 *
 * BasicBlock and ControlFlowGraph definitions.
 *
 * @module compiler/utils/cfg
 */

import type { Expression } from './constants';
import type { Instruction } from './instructions';

/**
 * Basic block - a sequence of instructions with a single entry and exit.
 */
export interface BasicBlock {
    /** Unique block identifier */
    readonly id: number;
    /** Instructions in this block */
    readonly instructions: readonly (Expression | Instruction)[];
    /** IDs of successor blocks (control flow going out) */
    readonly successors: readonly number[];
    /** IDs of predecessor blocks (control flow coming in) */
    readonly predecessors: readonly number[];
}

/**
 * Control Flow Graph - represents program structure as basic blocks.
 */
export class ControlFlowGraph {
    constructor(
        public readonly entryBlock: number,
        public readonly exitBlock: number,
        public readonly blocks: ReadonlyMap<number, BasicBlock>
    ) { }
}
