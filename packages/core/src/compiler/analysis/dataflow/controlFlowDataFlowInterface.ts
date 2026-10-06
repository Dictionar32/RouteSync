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

/** Aggregate CFG contract; solver implementation may provide both capabilities. */
export type ControlFlowDataFlowInterface<T> =
  DataFlowForwardInterface<T> & DataFlowBackwardInterface<T>;

/** Compatibility name retained for callers that imported the old contract. */
export type DataFlowAnalysisInterface<T> = ControlFlowDataFlowInterface<T>;
