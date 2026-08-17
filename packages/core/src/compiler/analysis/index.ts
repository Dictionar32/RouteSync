/**
 * @file analysis/index.ts
 * @description Compiler analysis module exports.
 */

export {
    DominatorTree,
    DominanceFrontier,
} from './DominatorAnalysis';

export {
    type LoopInfo,
    LoopAnalysis,
    LoopNormalizer,
} from './LoopAnalysis';

export {
    type SSABasicBlock,
    SSARepresentation,
    SSABuilder,
    SSARenamer,
} from './SSAAnalysis';

export {
    UseDefGraph,
} from './UseDefAnalysis';

export {
    type SymbolNode,
    SymbolDatabase,
} from './SymbolAnalysis';

export {
    type FlowState,
    DataFlowAnalysis,
} from './DataFlowAnalysis';

export {
    AnalysisDependencyGraph,
    AnalysisManager,
} from './AnalysisManager';

export {
    type AnalysisRegistry,
    type AnalysisKeyName,
    type AnalysisValue,
} from './AnalysisRegistry';

export {
    CFGAnalysis,
    DominatorsAnalysis,
    LoopInfoAnalysis,
    SSAAnalysis,
    UseDefAnalysis,
} from './AnalysisKey';

export {
    AnalysisKey,
    type DefaultAnalysisKey,
    createAnalysisKeyFactory,
} from '../passes/PassResult';