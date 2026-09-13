/**
 * @file LoopAnalysis.ts
 * @description Loop detection and analysis orchestrator.
 * Conforms to Rule 14: Active Consumer Orchestrator, 0 wildcard re-exports.
 *
 * @module compiler/analysis
 */

import type { ControlFlowGraph } from '../utils/ControlFlowGraph';
import type { DominatorTree } from './DominatorAnalysis';
import {
    type LoopInfo,
    detectNaturalLoops,
    LoopNormalizer
} from './loop';

export type { LoopInfo };
export { LoopNormalizer };

/**
 * Loop detection and analysis orchestrator.
 *
 * Identifies natural loops in CFG using dominance analysis.
 *
 * @example
 * ```typescript
 * const loops = LoopAnalysis.analyze(cfg, dominatorTree);
 * ```
 */
export class LoopAnalysis {
    /**
     * Analyze CFG to detect all natural loops.
     *
     * @param cfg - Control flow graph
     * @param dom - Dominator tree
     * @returns Array of detected loops
     */
    public static analyze(
        cfg: ControlFlowGraph,
        dom: DominatorTree
    ): readonly LoopInfo[] {
        return detectNaturalLoops(cfg, dom);
    }
}
