/**
 * dominanceFrontier.ts
 *
 * Dominance frontier computation for CFGs. Used in SSA construction for phi node placement.
 *
 * @module core/compiler/analysis/dominator
 */

import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';
import { DominatorTree } from './dominatorTree';

/**
 * Dominance frontier computation.
 * Dominance frontier of node N is the set of nodes where:
 * - N dominates a predecessor of the node
 * - N does not strictly dominate the node itself
 */
export class DominanceFrontier {
    /** Dominance frontier map: blockId -> set of frontier blocks */
    private frontiers = new Map<number, Set<number>>();

    /**
     * Compute dominance frontiers for all blocks in CFG.
     */
    public compute(cfg: ControlFlowGraph, dom: DominatorTree): void {
        this.frontiers.clear();
        for (const [blockId] of cfg.blocks) {
            this.frontiers.set(blockId, new Set());
        }

        for (const [blockId, block] of cfg.blocks) {
            // Only process join points (multiple predecessors)
            if (block.predecessors.length >= 2) {
                for (const predId of block.predecessors) {
                    let runner: number | undefined = predId;
                    const idom = dom.getImmediateDominator(blockId);

                    while (runner !== idom && runner !== undefined) {
                        this.frontiers.get(runner)?.add(blockId);

                        const next: number | undefined = dom.getImmediateDominator(runner);

                        // Prevent infinite loop
                        if (next === runner) break;

                        runner = next;
                    }
                }
            }
        }
    }

    /**
     * Get dominance frontier for given block.
     */
    public getFrontier(blockId: number): ReadonlySet<number> {
        return this.frontiers.get(blockId) ?? new Set();
    }

    /**
     * Clear all frontier information.
     */
    public clear(): void {
        this.frontiers.clear();
    }
}
