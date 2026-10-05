import { relationEqual, relationAll } from '../../../../semantic/foundation/semanticRelations';
import { relationFixedPoint, relationResolve, relationGate } from '../../../relational/sequence';
import { TokenCursor } from './relationalSyntaxCursor';

export type SyntaxScanDecision = 'continue' | 'stop';
export type SyntaxScanStep<T> =
  | { readonly decision: 'continue'; readonly cursor: TokenCursor; readonly values: readonly T[] }
  | { readonly decision: 'stop'; readonly values: readonly T[] };

export interface SyntaxScanState<T> {
  readonly cursor: TokenCursor;
  readonly values: readonly T[];
  readonly decision: SyntaxScanDecision;
}

export const continueScan = <T>(cursor: TokenCursor, ...values: readonly T[]): SyntaxScanStep<T> =>
  Object.freeze({ decision: 'continue', cursor, values: Object.freeze(values) });

export const stopScan = <T>(...values: readonly T[]): SyntaxScanStep<T> =>
  Object.freeze({ decision: 'stop', values: Object.freeze(values) });

const stepState = <T>(state: SyntaxScanState<T>, step: SyntaxScanStep<T>): SyntaxScanState<T> =>
  relationGate(relationEqual(step.decision, 'continue'),
    () => Object.freeze({ cursor: step.cursor, values: Object.freeze([...state.values, ...step.values]), decision: 'continue' as const }),
    () => Object.freeze({ cursor: state.cursor, values: Object.freeze([...state.values, ...step.values]), decision: 'stop' as const }));

export interface SyntaxScan<T> {
  readonly values: readonly T[];
}

/** Runtime traversal is a fixed-point relation; semantic decisions are supplied by evidence adapters. */
export const syntaxScan = <T>(start: TokenCursor, step: (cursor: TokenCursor) => SyntaxScanStep<T>): SyntaxScan<T> => {
  const seed: SyntaxScanState<T> = Object.freeze({ cursor: start, values: Object.freeze([]), decision: 'continue' });
  const closure = relationFixedPoint(
    seed,
    state => {
      const terminal = relationGate(relationEqual(state.decision, 'stop'), () => true, () => state.cursor.atEnd);
      return relationResolve(terminal, () => state, () => stepState(state, step(state.cursor)));
    },
    (left, right) => relationAll([relationEqual(left.cursor, right.cursor), relationEqual(left.decision, right.decision), relationEqual(left.values.length, right.values.length)]),
  );
  return Object.freeze({ values: closure.value.values });
};
