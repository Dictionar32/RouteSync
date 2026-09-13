/**
 * @file DataFlowAnalysis.ts
 * @description Generic data flow analysis framework
 */

import type { ControlFlowGraph, BasicBlock } from '../utils/ControlFlowGraph';
import {
  type FlowState,
  type TransferFn,
  type MergeFn,
  runForwardAnalysis,
  runBackwardAnalysis
} from './dataflow';

export type { FlowState, TransferFn, MergeFn };

export class DataFlowAnalysis<T> {
  public analyze(
    cfg: ControlFlowGraph,
    initialState: T,
    transfer: (block: BasicBlock, state: T) => T,
    merge: (states: readonly T[]) => T
  ): ReadonlyMap<number, FlowState<T>> {
    return runForwardAnalysis(cfg, initialState, transfer, merge);
  }

  public analyzeBackward(
    cfg: ControlFlowGraph,
    initialState: T,
    transfer: (block: BasicBlock, state: T) => T,
    merge: (states: readonly T[]) => T
  ): ReadonlyMap<number, FlowState<T>> {
    return runBackwardAnalysis(cfg, initialState, transfer, merge);
  }
}
