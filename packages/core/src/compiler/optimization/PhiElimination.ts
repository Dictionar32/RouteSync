/**
 * @fileoverview Phi Elimination - Remove phi nodes from SSA form
 * 
 * Transforms SSA form back to conventional form by replacing phi nodes
 * with copy instructions in predecessor blocks.
 */

import type { ControlFlowGraph, BasicBlock } from '../utils/ControlFlowGraph';
import type { Instruction } from '../ir/Instruction';
import type { Expression } from '../ir/Expression';

/**
 * Phi node elimination pass
 * 
 * Converts SSA form to conventional form by replacing phi instructions
 * with explicit copy operations in predecessor blocks.
 * 
 * @example
 * ```typescript
 * // Before (SSA with phi):
 * // Block 2:
 * //   v3 = phi(v1 from Block 0, v2 from Block 1)
 * 
 * // After (conventional form):
 * // Block 0:
 * //   v3 = v1
 * //   jump Block 2
 * // Block 1:
 * //   v3 = v2
 * //   jump Block 2
 * // Block 2:
 * //   (no phi)
 * 
 * const dephied = PhiEliminator.eliminate(cfg);
 * ```
 */
export class PhiEliminator {
    /**
     * Eliminate all phi nodes in the CFG
     * 
     * Replaces each phi node with copy instructions inserted at the end
     * of each predecessor block (before the terminator).
     * 
     * @param cfg - Control flow graph in SSA form
     * @returns New CFG with phi nodes eliminated
     */
    public static eliminate(cfg: ControlFlowGraph): ControlFlowGraph {
        const blocks = new Map<number, BasicBlock>(cfg.blocks);

        for (const [blockId, block] of cfg.blocks) {
            const phiNodes: Instruction[] = [];
            const nonPhiNodes: (Expression | Instruction)[] = [];

            // Separate phi nodes from other instructions
            for (const inst of block.instructions) {
                if (inst.kind === 'Phi') {
                    phiNodes.push(inst);
                } else {
                    nonPhiNodes.push(inst);
                }
            }

            if (phiNodes.length === 0) continue;

            // For each phi node, insert copies in predecessor blocks
            for (const phi of phiNodes) {
                if (phi.kind !== 'Phi') continue;

                for (const [predId, operand] of phi.incoming) {
                    const predBlock = blocks.get(predId);
                    if (!predBlock) continue;

                    // Create copy instruction: target = operand
                    const copyInst: Instruction = {
                        kind: 'Assign',
                        target: phi.target,
                        value: operand
                    };

                    // Find terminator position
                    const terminatorIndex = predBlock.instructions.findIndex(inst =>
                        inst.kind === 'Jump' || inst.kind === 'Branch' || inst.kind === 'Return'
                    );

                    // Insert copy before terminator
                    const nextInstructions = [...predBlock.instructions];
                    if (terminatorIndex === -1) {
                        // No terminator, append at end
                        nextInstructions.push(copyInst);
                    } else {
                        // Insert before terminator
                        nextInstructions.splice(terminatorIndex, 0, copyInst);
                    }

                    blocks.set(predId, {
                        ...predBlock,
                        instructions: nextInstructions
                    });
                }
            }

            // Remove phi nodes from current block
            blocks.set(blockId, {
                ...block,
                instructions: nonPhiNodes
            });
        }

        return new ControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
    }
}
