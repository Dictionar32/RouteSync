/**
 * DominatorAnalysis.ts
 *
 * Active Consumer Orchestrator for Dominance and Dominator Tree Analysis.
 * Coordinates DominatorTree computation and DominanceFrontier derivation.
 *
 * @module core/compiler/analysis/DominatorAnalysis
 */

import type { ControlFlowGraph } from '../utils/ControlFlowGraph';
import {
    DominatorTree,
    DominanceFrontier
} from './dominator';

export {
    DominatorTree,
    DominanceFrontier
};

export interface DominanceAnalysisResult {
    readonly dominatorTree: DominatorTree;
    readonly dominanceFrontier: DominanceFrontier;
}

/**
 * Operational Coordinator for Dominance Analysis.
 * Active Consumer executing full dominance tree + frontier analysis.
 */
export class DominatorAnalysisEngine {
    /**
     * Compute full dominance tree and dominance frontier for CFG.
     */
    public static analyze(cfg: ControlFlowGraph): DominanceAnalysisResult {
        const dominatorTree = new DominatorTree();
        dominatorTree.compute(cfg);

        const dominanceFrontier = new DominanceFrontier();
        dominanceFrontier.compute(cfg, dominatorTree);

        return {
            dominatorTree,
            dominanceFrontier
        };
    }
}

/**
 * Functional entry point for Dominance Analysis.
 */
export function computeDominanceAnalysis(cfg: ControlFlowGraph): DominanceAnalysisResult {
    return DominatorAnalysisEngine.analyze(cfg);
}
