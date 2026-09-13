/**
 * backwardSolver.ts
 *
 * Iterative worklist solver for backward data flow analysis.
 *
 * @module core/compiler/analysis/dataflow
 */

import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';
import type { FlowState, TransferFn, MergeFn } from './types';

export function runBackwardAnalysis<T>(
  cfg: ControlFlowGraph,
  initialState: T,
  transfer: TransferFn<T>,
  merge: MergeFn<T>
): ReadonlyMap<number, FlowState<T>> {
  const states = new Map<number, FlowState<T>>();
  for (const [id] of cfg.blocks) {
    states.set(id, { inState: initialState, outState: initialState });
  }

  const worklist = Array.from(cfg.blocks.keys()).reverse();

  while (worklist.length > 0) {
    const blockId = worklist.shift()!;
    const block = cfg.blocks.get(blockId)!;
    const current = states.get(blockId)!;

    const succStates = block.successors
      .map(sid => states.get(sid)?.inState)
      .filter((s): s is T => s !== undefined);

    const newOutState = succStates.length > 0 ? merge(succStates) : current.outState;
    const newInState = transfer(block, newOutState);

    const inChanged = JSON.stringify(current.inState) !== JSON.stringify(newInState);
    const outChanged = JSON.stringify(current.outState) !== JSON.stringify(newOutState);

    if (inChanged || outChanged) {
      states.set(blockId, { inState: newInState, outState: newOutState });
      for (const pred of block.predecessors) {
        if (!worklist.includes(pred)) {
          worklist.push(pred);
        }
      }
    }
  }

  return states;
}
