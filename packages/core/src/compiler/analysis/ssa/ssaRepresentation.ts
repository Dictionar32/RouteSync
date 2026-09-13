/**
 * ssaRepresentation.ts
 *
 * SSA (Static Single Assignment) data structures and basic block representation.
 *
 * @module core/compiler/analysis/ssa/ssaRepresentation
 */

import type { BasicBlock } from '../../utils/ControlFlowGraph';

/**
 * SSA basic block type
 * Currently aliases BasicBlock - SSA form uses same structure
 */
export type SSABasicBlock = BasicBlock;

/**
 * SSA representation of program
 * 
 * In SSA form:
 * - Each variable defined exactly once
 * - Each use refers to single definition
 * - Phi functions at join points to merge values
 */
export class SSARepresentation {
    constructor(
        /** Entry block ID */
        public readonly entryBlock: number,

        /** Map of block ID -> SSA basic block */
        public readonly blocks: ReadonlyMap<number, SSABasicBlock>
    ) { }

    /**
     * Get block by ID
     */
    public getBlock(id: number): SSABasicBlock | undefined {
        return this.blocks.get(id);
    }

    /**
     * Get all block IDs
     */
    public get blockIds(): readonly number[] {
        return Array.from(this.blocks.keys());
    }
}
