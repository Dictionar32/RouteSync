/**
 * @file analysis/index.ts
 * @description Compiler analysis module exports.
 */

export {
    type DominatorTree,
    type DominanceFrontier,
    createDominatorTree,
    createDominanceFrontier,
} from './DominatorAnalysis';

export {
    type LoopInfo,
    LoopAnalysis,
    LoopNormalizer,
} from './LoopAnalysis';

export {
    type SSABasicBlock,
    type SSARepresentation,
    SSAAnalysisEngine,
    computeSSA,
} from './SSAAnalysis';

export {
    SSARenamer,
    type SSARenamer,
    createSSARenamer,
    renameSSA,
} from './ssa/ssaRenamer';

export {
    SSABuilder,
    insertPhiNodes,
} from './ssa/ssaBuilder';


export {
    UseDefGraph,
} from './UseDefAnalysis';

export {
    type SymbolNode,
    SymbolDatabase,
    createSymbolDatabase,
} from './SymbolAnalysis';

export {
    type FlowState,
    DataFlowAnalysis,
} from './DataFlowAnalysis';

export {
    type AnalysisDependencyGraph,
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
export * from './astAnalysisInterface';
export * from './ssa/ssaSemanticInterface';

export * from './semanticDataflowPipeline';

export * from './routeSyncDataflowAnalysis';

export * from './semanticDataflowRuntimeBoundary';
export * from './semanticDataflowRuntimeComposition';
export * from './semanticDataflowDataFlowAdapter';

export * from './routeSyncManifestDataflowProjection';
export * from './routeSyncManifestDataflowProjectionInterface';
