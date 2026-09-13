/**
 * dominatorRpo.ts
 *
 * Reverse postorder traversal computation for Control Flow Graphs.
 *
 * @module core/compiler/analysis/dominator
 */

import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';

/**
 * Compute reverse postorder traversal of CFG.
 * RPO ensures dominators are processed before dominated nodes, leading to faster convergence.
 */
export function computeRPO(cfg: ControlFlowGraph): readonly number[] {
    const visited = new Set<number>();
    const order: number[] = [];

    const dfs = (nodeId: number) => {
        visited.add(nodeId);
        const block = cfg.blocks.get(nodeId);

        if (block) {
            for (const succ of block.successors) {
                if (!visited.has(succ)) {
                    dfs(succ);
                }
            }
        }

        order.push(nodeId);
    };

    dfs(cfg.entryBlock);

    return order.reverse();
}
