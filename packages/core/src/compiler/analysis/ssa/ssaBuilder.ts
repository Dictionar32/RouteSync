/**
 * ssaBuilder.ts
 *
 * SSA construction via phi node placement at dominance frontiers.
 *
 * @module core/compiler/analysis/ssa/ssaBuilder
 */

import { ControlFlowGraph, type BasicBlock, type Instruction, type Operand } from '../../utils/ControlFlowGraph';
import type { DominanceFrontier } from '../DominatorAnalysis';

/**
 * SSA construction via phi insertion
 * 
 * Implements classic algorithm:
 * Places phi nodes at join points (dominance frontiers) for each variable.
 */
export class SSABuilder {
    /**
     * Insert phi nodes for SSA construction
     * 
     * @param cfg - Control flow graph
     * @param df - Dominance frontier
     * @param variables - Variable IDs to process
     * @returns CFG with phi nodes inserted
     */
    public static insertPhiNodes(
        cfg: ControlFlowGraph,
        df: DominanceFrontier,
        variables: readonly number[]
    ): ControlFlowGraph {
        const blocks = new Map<number, BasicBlock>(cfg.blocks);

        for (const varId of variables) {
            // Find blocks that define this variable
            const defBlocks = new Set<number>();

            for (const [blockId, block] of cfg.blocks) {
                for (const inst of block.instructions) {
                    if (inst.kind === 'Assign' && inst.target === varId) {
                        defBlocks.add(blockId);
                    }
                }
            }

            // Iteratively place phi nodes at frontiers
            const worklist = Array.from(defBlocks);
            const addedPhis = new Set<number>();

            while (worklist.length > 0) {
                const x = worklist.shift()!;

                // For each block in dominance frontier
                for (const y of df.getFrontier(x)) {
                    if (!addedPhis.has(y)) {
                        const block = blocks.get(y);
                        if (block) {
                            // Create phi node with incoming from each predecessor
                            const incoming = new Map<number, Operand>();
                            for (const pred of block.predecessors) {
                                incoming.set(pred, { kind: 'Variable', id: varId });
                            }

                            const phiInst: Instruction = {
                                kind: 'Phi',
                                target: varId,
                                incoming
                            };

                            // Insert phi at beginning of block
                            blocks.set(y, {
                                ...block,
                                instructions: [phiInst, ...block.instructions]
                            });

                            addedPhis.add(y);

                            // If this block wasn't already a def block, add to worklist
                            if (!defBlocks.has(y)) {
                                worklist.push(y);
                            }
                        }
                    }
                }
            }
        }

        return new ControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
    }
}
