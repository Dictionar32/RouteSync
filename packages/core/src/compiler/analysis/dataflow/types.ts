/**
 * types.ts
 *
 * FlowState type and solver callbacks for data flow analysis.
 *
 * @module core/compiler/analysis/dataflow
 */

import type { BasicBlock } from '../../utils/ControlFlowGraph';

export interface FlowState<T> {
  readonly inState: T;
  readonly outState: T;
}

export type TransferFn<T> = (block: BasicBlock, state: T) => T;
export type MergeFn<T> = (states: readonly T[]) => T;
