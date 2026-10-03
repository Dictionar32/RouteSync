/** Declarative backward dataflow fixed-point solver. */
import type { ControlFlowGraph, BasicBlock } from '../../utils/cfg/basicBlock';
import type { FlowState, TransferFn, MergeFn } from './types';
import type { RelationIndex } from '../../../semantic/kernel/relationMembership';
import {
  relationEvery,
  relationFirstOption,
  relationOptionFold,
  relationProject,
  relationResolve,
  relationFixedPoint,
} from '../../../semantic/kernel/relationalSequence';
import { relationNotEqual } from '../../../semantic/kernel/semanticRelations';

const flowEntry = <T>(id: number, state: FlowState<T>): readonly [number, FlowState<T>] => [id, state];

const stateEntry = <T>(entries: readonly (readonly [number, FlowState<T>])[], id: number) =>
  relationFirstOption(entries, ([candidate]) => Object.is(candidate, id));

const stateValue = <T>(entries: readonly (readonly [number, FlowState<T>])[], id: number, fallback: FlowState<T>): FlowState<T> =>
  relationOptionFold(stateEntry(entries, id), () => fallback, entry => entry[1]);

const successorStates = <T>(block: BasicBlock, entries: readonly (readonly [number, FlowState<T>])[], initialState: T): readonly T[] =>
  relationProject(
    block.successors,
    successorId => relationOptionFold(
      stateEntry(entries, successorId),
      () => initialState,
      entry => entry[1].inState,
    ),
  );

const deriveRound = <T>(cfg: ControlFlowGraph, entries: readonly (readonly [number, FlowState<T>])[], initialState: T, transfer: TransferFn<T>, merge: MergeFn<T>) =>
  relationProject(
    cfg.blocks,
    ([id, block]) => {
      const current = stateValue(entries, id, { inState: initialState, outState: initialState });
      const successors = successorStates(block, entries, initialState);
      const newOutState = relationResolve(relationNotEqual(successors.length, 0), () => merge(successors), () => current.outState);
      const newInState = transfer(block, newOutState);
      return flowEntry(id, { inState: newInState, outState: newOutState });
    },
  );

const converged = <T>(previous: readonly (readonly [number, FlowState<T>])[], next: readonly (readonly [number, FlowState<T>])[]): boolean =>
  relationEvery(previous, (entry, index) => {
    const candidate = next[index];
    return Object.is(JSON.stringify(entry[1].inState), JSON.stringify(candidate[1].inState))
      && Object.is(JSON.stringify(entry[1].outState), JSON.stringify(candidate[1].outState));
  });

export function runBackwardAnalysis<T>(cfg: ControlFlowGraph, initialState: T, transfer: TransferFn<T>, merge: MergeFn<T>): RelationIndex<number, FlowState<T>> {
  const seed = relationProject(cfg.blocks, ([id]) => flowEntry(id, { inState: initialState, outState: initialState }));
  const fixedPoint = relationFixedPoint(
    seed,
    entries => deriveRound(cfg, entries, initialState, transfer, merge),
    converged,
  );
  return fixedPoint.value;
}
