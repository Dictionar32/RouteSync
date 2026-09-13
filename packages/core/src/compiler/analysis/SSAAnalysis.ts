/**
 * @file SSAAnalysis.ts
 * @description Active Consumer Orchestrator for SSA (Static Single Assignment) form construction and analysis.
 * Conforms to Rule 14: Active Consumer with Pure Flow Declaration, zero wildcard re-exports.
 *
 * @module core/compiler/analysis/SSAAnalysis
 */

import type { ControlFlowGraph } from '../utils/ControlFlowGraph';
import type { DominanceFrontier, DominatorTree } from './DominatorAnalysis';
import {
    type SSABasicBlock,
    SSARepresentation,
    SSABuilder,
    SSARenamer
} from './ssa';

export {
    type SSABasicBlock,
    SSARepresentation,
    SSABuilder,
    SSARenamer
};

/**
 * Active Consumer Orchestrator: Converts a standard ControlFlowGraph into SSA form.
 * Coordinates phi-node placement via DominanceFrontier and variable renaming via DominatorTree.
 */
export class SSAAnalysisEngine {
    /**
     * Pure Flow Declaration: CFG + DominanceFrontier + DominatorTree -> SSARepresentation
     */
    public static computeSSA(
        cfg: ControlFlowGraph,
        df: DominanceFrontier,
        dom: DominatorTree,
        variables: readonly number[]
    ): SSARepresentation {
        const cfgWithPhis = SSABuilder.insertPhiNodes(cfg, df, variables);
        const renamer = new SSARenamer();
        const ssaCfg = renamer.rename(cfgWithPhis, dom);
        return new SSARepresentation(ssaCfg.entryBlock, ssaCfg.blocks);
    }
}
