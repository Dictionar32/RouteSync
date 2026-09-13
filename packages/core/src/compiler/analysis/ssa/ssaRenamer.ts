/**
 * ssaRenamer.ts
 *
 * Active Consumer: SSA variable renaming using Cytron et al. dominator tree traversal.
 *
 * @module core/compiler/analysis/ssa/ssaRenamer
 */

import { ControlFlowGraph, type BasicBlock } from '../../utils/ControlFlowGraph';
import type { DominatorTree } from '../DominatorAnalysis';
import {
    VariableVersionScope,
    renameBlockInstructions,
    updateSuccessorPhis
} from './renamer';

/**
 * SSA variable renaming
 *
 * Renames variables in SSA form so that each definition gets a unique name.
 * Implements algorithm from Cytron et al.
 */
export class SSARenamer {
    private scope = new VariableVersionScope();

    /**
     * Rename variables in CFG for SSA form
     *
     * @param cfg - CFG with phi nodes inserted
     * @param dom - Dominator tree
     * @returns CFG with renamed variables
     */
    public rename(cfg: ControlFlowGraph, dom: DominatorTree): ControlFlowGraph {
        const blocks = new Map<number, BasicBlock>(cfg.blocks);

        // Initialize counters and stacks
        for (const [_, block] of cfg.blocks) {
            for (const inst of block.instructions) {
                if (inst.kind === 'Assign') {
                    this.scope.init(inst.target);
                }
            }
        }

        // Recursive renaming starting from entry
        this.renameBlock(cfg.entryBlock, blocks, dom, cfg);

        return new ControlFlowGraph(cfg.entryBlock, cfg.exitBlock, blocks);
    }

    /**
     * Rename variables in single block and recursively process children
     */
    private renameBlock(
        blockId: number,
        blocks: Map<number, BasicBlock>,
        dom: DominatorTree,
        cfg: ControlFlowGraph
    ): void {
        const block = blocks.get(blockId);
        if (!block) return;

        const newInstructions = renameBlockInstructions(block.instructions, this.scope);

        blocks.set(blockId, {
            ...block,
            instructions: newInstructions
        });

        // Update phi nodes in successors
        updateSuccessorPhis(blockId, block.successors, blocks, this.scope);

        // Recursively process dominated children
        const children = dom.getChildren(blockId);
        for (const childId of children) {
            this.renameBlock(childId, blocks, dom, cfg);
        }

        // Pop versions after processing block
        for (const inst of block.instructions) {
            if (inst.kind === 'Assign' || inst.kind === 'Phi') {
                this.scope.popVersion(inst.target);
            }
        }
    }
}
