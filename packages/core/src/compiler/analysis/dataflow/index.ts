/**
 * index.ts
 *
 * Sub-domain exports for data flow analysis framework.
 *
 * @module core/compiler/analysis/dataflow
 */

export type { FlowState, TransferFn, MergeFn } from './types';
export { runForwardAnalysis } from './forwardSolver';
export { runBackwardAnalysis } from './backwardSolver';

export type { ControlFlowDataFlowInterface, DataFlowAnalysisInterface, DataFlowForwardInterface, DataFlowBackwardInterface } from './controlFlowDataFlowInterface';

export { createDataFlowConfig } from './dataFlowConfigInterface';
export { liftDataFlowConfigToState } from './dataFlowStateConfigInterface';
export { composeDataFlowConfigContributors } from './dataFlowConfigContributorInterface';
export type { DataFlowConfigInterface, DataFlowSourcePredicateInterface, DataFlowSinkPredicateInterface, DataFlowAdditionalStepInterface, DataFlowBarrierInterface } from './dataFlowConfigInterface';
export type { DataFlowStateConfigInterface } from './dataFlowStateConfigInterface';
export type { DataFlowConfigContribution, DataFlowConfigContributorInterface } from './dataFlowConfigContributorInterface';
export type { DataFlowFactPolicyInterface } from './dataFlowFactPolicyInterface';
export { selectDataFlowFacts } from './dataFlowFactPolicyInterface';
export { createSemanticDataflowAnalysisPolicy, semanticDataflowFlowsUnderPolicy } from './semanticDataflowFactAnalysisPolicy';
export { createSemanticDataflowStatePolicy } from './semanticDataflowStatePolicy';
export type { SemanticDataflowStatePolicy } from './semanticDataflowStatePolicy';
