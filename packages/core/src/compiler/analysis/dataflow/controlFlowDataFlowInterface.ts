import type { ControlFlowGraph } from '../../utils/cfg/basicBlock';
import type { FlowState, MergeFn, TransferFn } from './types';
import type { RelationIndex } from '../../../semantic/foundation/relationMembership';

/** Forward CFG data-flow capability. */
export interface DataFlowForwardInterface<T> {
  readonly analyze: (
    cfg: ControlFlowGraph,
    initialState: T,
    transfer: TransferFn<T>,
    merge: MergeFn<T>,
  ) => RelationIndex<number, FlowState<T>>;
}

/** Backward CFG data-flow capability. */
export interface DataFlowBackwardInterface<T> {
  readonly analyzeBackward: (
    cfg: ControlFlowGraph,
    initialState: T,
    transfer: TransferFn<T>,
    merge: MergeFn<T>,
  ) => RelationIndex<number, FlowState<T>>;
}

/**
 * CFG solver contract.
 *
 * This is deliberately named as a solver contract, not the canonical
 * `DataFlowInterface` from `types/dataflow`. The two operate at different
 * layers: this one consumes a concrete CFG and computes block states; the
 * canonical interface transports an already-domain-typed data-flow state
 * across the downstream wiring boundary.
 */
export type ControlFlowSolverInterface<T> =
  DataFlowForwardInterface<T> & DataFlowBackwardInterface<T>;

/** Compatibility name retained for callers that imported the old contract. */
export type ControlFlowDataFlowInterface<T> = ControlFlowSolverInterface<T>;

/** Compatibility name retained for callers that imported the old contract. */
export type DataFlowAnalysisInterface<T> = ControlFlowSolverInterface<T>;
