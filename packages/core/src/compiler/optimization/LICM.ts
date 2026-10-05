/**
 * @fileoverview LICM - Loop-Invariant Code Motion
 * 
 * Optimizes loops by hoisting invariant computations out of the loop body
 * into the preheader block.
 */

import type { ControlFlowGraph, BasicBlock } from '../utils/ControlFlowGraph';
import { basicBlockLookup, basicBlockReplace, createControlFlowGraph, type BasicBlockRelation } from '../utils/ControlFlowGraph';
import type { Instruction } from '../utils/cfg/instructions';
import type { Expression } from '../utils/cfg/constants';
import { relationIsSome, relationGate, relationOptionFold } from '../../semantic/foundation/relationFoundation';
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
        let blocks: BasicBlockRelation = cfg.blocks;
        const preHeaderOption = basicBlockLookup(blocks, preHeaderId);
        if (!relationIsSome(preHeaderOption)) return cfg;
        const preHeader = preHeaderOption.value;

        const hoisted: Instruction[] = [];

        // Scan loop blocks for hoistable instructions
        for (const blockId of loopBlocks) {
            const blockOption = basicBlockLookup(blocks, blockId);
            if (!relationIsSome(blockOption)) continue;
            const block = blockOption.value;

            const remaining: (Expression | Instruction)[] = [];

            for (const inst of block.instructions) {
                if (inst.kind === 'Assign' && isSpeculatable(inst)) {
                    let isInvariant = true;

                    // Check if operands are defined outside loop
                    if (inst.value.kind === 'SSAValue') {
                        const definitionIsInsideLoop = relationOptionFold(
                            useDef.getDefinition(inst.value.id),
                            () => false,
                            value => loopBlocks.has(value),
                        );
                        if (definitionIsInsideLoop) isInvariant = false;
                    } else if (inst.value.kind === 'Variable') {
                        const definitionIsInsideLoop = relationOptionFold(
                            useDef.getDefinition(inst.value.id),
                            () => false,
                            value => loopBlocks.has(value),
                        );
                        if (definitionIsInsideLoop) isInvariant = false;
                    }

                    if (isInvariant) {
                        // Hoist this instruction
                        hoisted.push(inst);
                        continue;
                    }
                }

                remaining.push(inst);
            }

            blocks = basicBlockReplace(blocks, blockId, { ...block, instructions: remaining });
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

            blocks = basicBlockReplace(blocks, preHeaderId, { ...preHeader, instructions: nextInsts });
        }

        return createControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
    }
}

/**
 * Re-export LoopNormalizer for convenience
 * 
 * LoopNormalizer ensures loops have proper preheader blocks,
 * which is a prerequisite for LICM optimization.
 */
export { LoopNormalizer };
