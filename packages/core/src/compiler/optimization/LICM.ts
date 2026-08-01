/**
 * @fileoverview LICM - Loop-Invariant Code Motion
 * 
 * Optimizes loops by hoisting invariant computations out of the loop body
 * into the preheader block.
 */

import type { ControlFlowGraph, BasicBlock } from '../utils/ControlFlowGraph';
import type { Instruction } from '../ir/Instruction';
import type { Expression } from '../ir/Expression';
import type { UseDefGraph } from '../analysis/UseDefAnalysis';
import { isSpeculatable } from './InstructionEffect';
import { LoopNormalizer } from '../analysis/LoopAnalysis';

/**
 * Loop-Invariant Code Motion optimizer
 * 
 * Hoists loop-invariant instructions to the loop preheader, reducing
 * redundant computation in loop bodies.
 * 
 * @example
 * ```typescript
 * // Before:
 * // Loop Header:
 * //   v2 = x + 1  // x is loop-invariant
 * //   v3 = v2 * i // depends on loop variable i
 * 
 * // After:
 * // Preheader:
 * //   v2 = x + 1  // hoisted
 * // Loop Header:
 * //   v3 = v2 * i
 * 
 * const optimized = LICMOptimizer.hoistInvariants(cfg, loopBlocks, preHeaderId, useDef);
 * ```
 */
export class LICMOptimizer {
    /**
     * Hoist loop-invariant instructions to preheader
     * 
     * Identifies instructions in the loop whose operands are defined outside
     * the loop, and moves them to the preheader block.
     * 
     * @param cfg - Control flow graph
     * @param loopBlocks - Set of block IDs in the loop
     * @param preHeaderId - ID of the loop preheader block
     * @param useDef - Use-definition analysis results
     * @returns New CFG with invariants hoisted
     */
    public static hoistInvariants(
        cfg: ControlFlowGraph,
        loopBlocks: ReadonlySet<number>,
        preHeaderId: number,
        useDef: UseDefGraph
    ): ControlFlowGraph {
        const blocks = new Map<number, BasicBlock>(cfg.blocks);
        const preHeader = blocks.get(preHeaderId);
        if (!preHeader) return cfg;

        const hoisted: Instruction[] = [];

        // Scan loop blocks for hoistable instructions
        for (const blockId of loopBlocks) {
            const block = blocks.get(blockId);
            if (!block) continue;

            const remaining: (Expression | Instruction)[] = [];

            for (const inst of block.instructions) {
                if (inst.kind === 'Assign' && isSpeculatable(inst)) {
                    let isInvariant = true;

                    // Check if operands are defined outside loop
                    if (inst.value.kind === 'SSAValue') {
                        const defBlock = useDef.getDefinition(inst.value.id);
                        if (defBlock !== undefined && loopBlocks.has(defBlock)) {
                            isInvariant = false;
                        }
                    } else if (inst.value.kind === 'Variable') {
                        const defBlock = useDef.getDefinition(inst.value.id);
                        if (defBlock !== undefined && loopBlocks.has(defBlock)) {
                            isInvariant = false;
                        }
                    }

                    if (isInvariant) {
                        // Hoist this instruction
                        hoisted.push(inst);
                        continue;
                    }
                }

                remaining.push(inst);
            }

            blocks.set(blockId, { ...block, instructions: remaining });
        }

        // Insert hoisted instructions into preheader (before terminator)
        if (hoisted.length > 0) {
            const terminatorIndex = preHeader.instructions.findIndex(inst =>
                inst.kind === 'Jump' || inst.kind === 'Branch' || inst.kind === 'Return'
            );

            const nextInsts = [...preHeader.instructions];
            if (terminatorIndex === -1) {
                nextInsts.push(...hoisted);
            } else {
                nextInsts.splice(terminatorIndex, 0, ...hoisted);
            }

            blocks.set(preHeaderId, { ...preHeader, instructions: nextInsts });
        }

        return new ControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
    }
}

/**
 * Re-export LoopNormalizer for convenience
 * 
 * LoopNormalizer ensures loops have proper preheader blocks,
 * which is a prerequisite for LICM optimization.
 */
export { LoopNormalizer };
