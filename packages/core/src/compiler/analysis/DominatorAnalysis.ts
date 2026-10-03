/** Declarative dominance-analysis projection. */
import type { ControlFlowGraph } from '../utils/ControlFlowGraph';
import { createDominatorTree, type DominatorTree } from './dominator/dominatorTree';
import { createDominanceFrontier, type DominanceFrontier } from './dominator/dominanceFrontier';

export { createDominatorTree, type DominatorTree, createDominanceFrontier, type DominanceFrontier };

export interface DominanceAnalysisResult {
    readonly dominatorTree: DominatorTree;
    readonly dominanceFrontier: DominanceFrontier;
}

export const computeDominanceAnalysis = (cfg: ControlFlowGraph): DominanceAnalysisResult => {
    const dominatorTree = createDominatorTree(cfg);
    const dominanceFrontier = createDominanceFrontier(cfg, dominatorTree);
    return Object.freeze({ dominatorTree, dominanceFrontier });
};

export const DominatorAnalysisEngine = Object.freeze({ analyze: computeDominanceAnalysis });
