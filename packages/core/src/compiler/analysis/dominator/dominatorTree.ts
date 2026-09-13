/**
 * dominatorTree.ts
 *
 * Dominator tree representation and iterative computation using Lengauer-Tarjan variant.
 *
 * @module core/compiler/analysis/dominator
 */

import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';
import { computeRPO } from './dominatorRpo';
import { intersectDominators } from './dominatorIntersect';

/**
 * Dominator tree for CFG analysis.
 * Node A dominates node B if all paths from entry to B must go through A.
 */
export class DominatorTree {
    /** Immediate dominator map: blockId -> immediate dominator blockId */
    private idoms = new Map<number, number>();

    /** Dominator tree structure: blockId -> set of immediately dominated children */
    private domTree = new Map<number, Set<number>>();

    /**
     * Compute dominator tree for given CFG.
     */
    public compute(cfg: ControlFlowGraph): void {
        const blocks = Array.from(cfg.blocks.values());
        if (blocks.length === 0) return;

        const startNode = cfg.entryBlock;
        // Entry node dominates itself
        this.idoms.set(startNode, startNode);

        // Compute in reverse postorder for faster convergence
        const rpo = computeRPO(cfg);

        // Iterative fixed-point computation
        let changed = true;
        while (changed) {
            changed = false;

            for (const blockId of rpo) {
                if (blockId === startNode) continue;

                const block = cfg.blocks.get(blockId)!;

                // Only consider predecessors with an existing dominator
                const processedPreds = block.predecessors.filter(p => this.idoms.has(p));
                if (processedPreds.length === 0) continue;

                // Find common dominator across all predecessors
                let newIdom = processedPreds[0]!;
                for (let i = 1; i < processedPreds.length; i++) {
                    const pred = processedPreds[i]!;
                    newIdom = intersectDominators(pred, newIdom, rpo, this.idoms);
                }

                // Update if changed
                if (this.idoms.get(blockId) !== newIdom) {
                    this.idoms.set(blockId, newIdom);
                    changed = true;
                }
            }
        }

        // Build dominator tree structure
        for (const [node, idom] of this.idoms) {
            if (node === startNode) continue;
            const children = this.domTree.get(idom) ?? new Set();
            children.add(node);
            this.domTree.set(idom, children);
        }
    }

    /**
     * Get immediate dominator of given block.
     */
    public getImmediateDominator(blockId: number): number | undefined {
        return this.idoms.get(blockId);
    }

    /**
     * Get all blocks immediately dominated by given block.
     */
    public getChildren(blockId: number): ReadonlySet<number> {
        return this.domTree.get(blockId) ?? new Set();
    }

    /**
     * Check if ancestor dominates descendant.
     */
    public dominates(ancestor: number, descendant: number): boolean {
        let current: number | undefined = descendant;

        while (current !== undefined) {
            if (current === ancestor) return true;

            const next: number | undefined = this.getImmediateDominator(current);

            // Prevent infinite loop (self-domination)
            if (next === current) break;

            current = next;
        }

        return false;
    }

    /**
     * Clear all dominator information.
     */
    public clear(): void {
        this.idoms.clear();
        this.domTree.clear();
    }
}
