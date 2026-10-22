/**
 * index.ts
 *
 * Sub-domain exports for data flow analysis framework.
 *
 * @module core/compiler/analysis/dataflow
 */

export type { FlowState, TransferFn, MergeFn } from './types';
export { runForwardAnalysis, runForwardAnalysisWithJudgment } from './forwardSolver';
export { runBackwardAnalysis, runBackwardAnalysisWithJudgment } from './backwardSolver';

export type { ControlFlowSolverInterface, ControlFlowDataFlowInterface, DataFlowAnalysisInterface, DataFlowForwardInterface, DataFlowBackwardInterface, DataFlowSolveJudgment } from './controlFlowDataFlowInterface';

export { createDataFlowConfig } from './dataFlowConfigInterface';
export { liftDataFlowConfigToState } from './dataFlowStateConfigInterface';
export { composeDataFlowConfigContributors } from './dataFlowConfigContributorInterface';
export type { DataFlowConfigInterface, DataFlowSourcePredicateInterface, DataFlowSinkPredicateInterface, DataFlowAdditionalStepInterface, DataFlowBarrierInterface } from './dataFlowConfigInterface';
export type { DataFlowStateConfigInterface } from './dataFlowStateConfigInterface';
export type { DataFlowConfigContribution, DataFlowConfigContributorInterface } from './dataFlowConfigContributorInterface';
export type { DataFlowFactPolicyInterface } from './dataFlowFactPolicyInterface';
export { selectDataFlowFacts } from './dataFlowFactPolicyInterface';
export { createSemanticDataflowAnalysisPolicy, semanticDataflowFlowsUnderPolicy } from './semanticDataflowFactAnalysisPolicy';
export type { SemanticDataflowAnalysisPolicy } from './semanticDataflowFactAnalysisPolicy';
export { createSemanticDataflowStatePolicy } from './semanticDataflowStatePolicy';
export type { SemanticDataflowStatePolicy } from './semanticDataflowStatePolicy';

export { DataFlowFixedPointIncompleteError } from './dataFlowSolveJudgment';
