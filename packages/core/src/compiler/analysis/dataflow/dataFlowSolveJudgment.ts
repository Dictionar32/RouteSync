import type { RelationFixedPoint } from '../../../semantic/relations/relationalSequence';
import type { RelationIndex } from '../../../semantic/relations/relationMembership';
import type { FlowState } from './types';

/** Retains the exact non-converged judgment when a compatibility API cannot return it. */
export class DataFlowFixedPointIncompleteError<T> extends Error {
  public readonly judgment: Extract<RelationFixedPoint<RelationIndex<number, FlowState<T>>>, { readonly kind: 'fixed_point_round_limit_reached' }>;

  public constructor(
    judgment: Extract<RelationFixedPoint<RelationIndex<number, FlowState<T>>>, { readonly kind: 'fixed_point_round_limit_reached' }>,
  ) {
    super(`Data-flow analysis did not converge within ${judgment.limit} rounds.`);
    this.name = 'DataFlowFixedPointIncompleteError';
    this.judgment = judgment;
  }
}

/** Legacy relation-only APIs may expose a value only when closure is established. */
export const requireConvergedDataFlow = <T>(
  judgment: RelationFixedPoint<RelationIndex<number, FlowState<T>>>,
): RelationIndex<number, FlowState<T>> => {
  switch (judgment.kind) {
    case 'fixed_point_converged':
      return judgment.value;
    case 'fixed_point_round_limit_reached':
      throw new DataFlowFixedPointIncompleteError(judgment);
  }
};
