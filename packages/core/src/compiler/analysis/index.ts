/**
 * @file analysis/index.ts
 * @description Compiler analysis module exports
 * 
 * Provides data flow dan control flow analysis components:
 * - CFG dominator analysis
 * - SSA construction
 * - Loop detection
 * - Use-def chains
 * - Symbol tracking
 * - Generic data flow framework
 */

// Dominator analysis
export {
    DominatorTree,
    DominanceFrontier
} from './DominatorAnalysis';

// Loop analysis
export {
    type LoopInfo,
    LoopAnalysis,
    LoopNormalizer
} from './LoopAnalysis';

// SSA analysis
export {
    type SSABasicBlock,
    SSARepresentation,
    SSABuilder,
    SSARenamer
} from './SSAAnalysis';

// Use-def analysis
export {
    UseDefGraph
} from './UseDefAnalysis';

// Symbol analysis
export {
    type SymbolNode,
    SymbolDatabase
} from './SymbolAnalysis';

// Data flow framework
export {
    type FlowState,
    DataFlowAnalysis
} from './DataFlowAnalysis';

// Analysis management
export {
    AnalysisDependencyGraph,
    AnalysisManager
} from './AnalysisManager';

// Re-export AnalysisKey from passes for convenience
export { AnalysisKey } from '../passes/PassResult';

// Analysis key constants
import type { ControlFlowGraph } from '../utils/ControlFlowGraph';
import type { DominatorTree } from './DominatorAnalysis';
import type { LoopAnalysis } from './LoopAnalysis';
import type { SSARepresentation } from './SSAAnalysis';
import type { UseDefGraph } from './UseDefAnalysis';
import { AnalysisKey } from '../passes/PassResult';

/**
 * Standard analysis keys untuk common analyses
 */

/** Control Flow Graph analysis */
export const CFGAnalysis = new AnalysisKey<ControlFlowGraph>('CFG');

/** Dominator tree analysis */
export const DominatorsAnalysis = new AnalysisKey<DominatorTree>('Dominators');

/** Loop information analysis */
export const LoopInfoAnalysis = new AnalysisKey<LoopAnalysis>('LoopInfo');

/** SSA form analysis */
export const SSAAnalysis = new AnalysisKey<SSARepresentation>('SSA');

/** Use-def chain analysis */
export const UseDefAnalysis = new AnalysisKey<UseDefGraph>('UseDef');
