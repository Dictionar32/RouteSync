/**
 * Natural Loop Detector.
 * Identifies natural loops in a CFG using dominance frontiers/dominance trees.
 *
 * @module compiler/analysis/loop
 */

import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';
import type { DominatorTree } from '../DominatorAnalysis';
import type { LoopInfo } from './loopTypes';

/**
 * Computes natural loop blocks for a given header and back edge sources.
 */
export function getNaturalLoopBlocks(
    header: number,
    backEdges: readonly number[],
    cfg: ControlFlowGraph
): ReadonlySet<number> {
    const loopBlocks = new Set<number>([header]);
    const queue: number[] = [];

    // Add back edge sources
    for (const edge of backEdges) {
        if (!loopBlocks.has(edge)) {
            loopBlocks.add(edge);
            queue.push(edge);
        }
    }

    // Backward traversal to find all loop blocks
    while (queue.length > 0) {
        const node = queue.shift()!;
        const block = cfg.blocks.get(node);

        if (block) {
            for (const pred of block.predecessors) {
                if (!loopBlocks.has(pred)) {
                    loopBlocks.add(pred);
                    queue.push(pred);
                }
            }
        }
    }

    return loopBlocks;
}

/**
 * Analyzes CFG to detect all natural loops.
 */
export function detectNaturalLoops(
    cfg: ControlFlowGraph,
    dom: DominatorTree
): readonly LoopInfo[] {
    const loopsMap = new Map<number, Set<number>>();

    // Find back edges: successor dominates current node
    for (const [nodeId, block] of cfg.blocks) {
        for (const succ of block.successors) {
            if (dom.dominates(succ, nodeId)) {
                const backEdges = loopsMap.get(succ) ?? new Set();
                backEdges.add(nodeId);
                loopsMap.set(succ, backEdges);
            }
        }
    }

    // Compute natural loop for each header
    const loopInfos: LoopInfo[] = [];
    for (const [header, backEdgesSet] of loopsMap) {
        const backEdges = Array.from(backEdgesSet);
        const loopBlocks = getNaturalLoopBlocks(header, backEdges, cfg);

        loopInfos.push({
            header,
            backEdges,
            loopBlocks
        });
    }

    return loopInfos;
}
