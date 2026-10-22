/**
 * @file DataFlowAnalysis.ts
 * @description Generic data flow analysis framework
 */

import type { ControlFlowGraph, BasicBlock } from '../utils/ControlFlowGraph';
import type { RelationIndex } from '../../semantic/relations/relationMembership';
import {
  type FlowState,
  type TransferFn,
  type MergeFn,
  runForwardAnalysis,
  runBackwardAnalysis,
  runForwardAnalysisWithJudgment,
  runBackwardAnalysisWithJudgment
} from './dataflow';
import type { ControlFlowSolverInterface, DataFlowSolveJudgment } from './dataflow/controlFlowDataFlowInterface';

export type { FlowState, TransferFn, MergeFn };

export class DataFlowAnalysis<T> implements ControlFlowSolverInterface<T> {
  public analyzeWithJudgment(
    cfg: ControlFlowGraph,
    initialState: T,
    transfer: (block: BasicBlock, state: T) => T,
    merge: (states: readonly T[]) => T
  ): DataFlowSolveJudgment<T> {
    return runForwardAnalysisWithJudgment(cfg, initialState, transfer, merge);
  }

  public analyzeBackwardWithJudgment(
    cfg: ControlFlowGraph,
    initialState: T,
    transfer: (block: BasicBlock, state: T) => T,
    merge: (states: readonly T[]) => T
  ): DataFlowSolveJudgment<T> {
    return runBackwardAnalysisWithJudgment(cfg, initialState, transfer, merge);
  }

  public analyze(
    cfg: ControlFlowGraph,
    initialState: T,
    transfer: (block: BasicBlock, state: T) => T,
    merge: (states: readonly T[]) => T
  ): RelationIndex<number, FlowState<T>> {
    return runForwardAnalysis(cfg, initialState, transfer, merge);
  }

  public analyzeBackward(
    cfg: ControlFlowGraph,
    initialState: T,
    transfer: (block: BasicBlock, state: T) => T,
    merge: (states: readonly T[]) => T
  ): RelationIndex<number, FlowState<T>> {
    return runBackwardAnalysis(cfg, initialState, transfer, merge);
  }
}
