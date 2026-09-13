/**
 * forwardSolver.ts
 *
 * Iterative worklist solver for forward data flow analysis.
 *
 * @module core/compiler/analysis/dataflow
 */

import type { ControlFlowGraph } from '../../utils/ControlFlowGraph';
import type { FlowState, TransferFn, MergeFn } from './types';

export function runForwardAnalysis<T>(
  cfg: ControlFlowGraph,
  initialState: T,
  transfer: TransferFn<T>,
  merge: MergeFn<T>
): ReadonlyMap<number, FlowState<T>> {
  const states = new Map<number, FlowState<T>>();
  for (const [id] of cfg.blocks) {
    states.set(id, { inState: initialState, outState: initialState });
  }

  const worklist = Array.from(cfg.blocks.keys());

  while (worklist.length > 0) {
    const blockId = worklist.shift()!;
    const block = cfg.blocks.get(blockId)!;
    const current = states.get(blockId)!;

    const predStates = block.predecessors
      .map(pid => states.get(pid)?.outState)
      .filter((s): s is T => s !== undefined);

    const newInState = predStates.length > 0 ? merge(predStates) : current.inState;
    const newOutState = transfer(block, newInState);

    const inChanged = JSON.stringify(current.inState) !== JSON.stringify(newInState);
    const outChanged = JSON.stringify(current.outState) !== JSON.stringify(newOutState);

    if (inChanged || outChanged) {
      states.set(blockId, { inState: newInState, outState: newOutState });
      for (const succ of block.successors) {
        if (!worklist.includes(succ)) {
          worklist.push(succ);
        }
      }
    }
  }

  return states;
}
