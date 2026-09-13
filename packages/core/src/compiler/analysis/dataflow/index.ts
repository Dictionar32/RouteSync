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
