/** Declarative SSA analysis projection. */

import type { ControlFlowGraph } from '../utils/ControlFlowGraph';
import type { DominanceFrontier, DominatorTree } from './DominatorAnalysis';
import { insertPhiNodes } from './ssa/ssaBuilder';
import { renameSSA } from './ssa/ssaRenamer';
import { createSSARepresentation, type SSARepresentation, type SSABasicBlock } from './ssa/ssaRepresentation';

export { type SSABasicBlock, type SSARepresentation } from './ssa/ssaRepresentation';

export const computeSSA = (
    cfg: ControlFlowGraph,
    df: DominanceFrontier,
    dom: DominatorTree,
    variables: readonly number[],
): SSARepresentation => createSSARepresentation(renameSSA(insertPhiNodes(cfg, df, variables), dom));

export const SSAAnalysisEngine = Object.freeze({ computeSSA });
