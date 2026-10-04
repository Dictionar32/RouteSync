/**
 * Phase 352 — typed semantic relation algebra.
 *
 * Evaluation is expressed as relation recursion and option witnesses.
 * Collection operations are semantic relation operators, never host-language
 * collection combinators or absence sentinels.
 */
import { relationContains, relationInsert, type RelationMembership } from '../../../../semantic/kernel/relationMembership';
import {
  relationResolve,
  relationFirstOption,
  relationOptionFold,
  relationAt,
} from '../../../../semantic/kernel/relationalSequence';

export interface TypedRelation<T> {
  readonly tuples: readonly T[];
}

export const typedRelation = <T>(tuples: readonly T[]): TypedRelation<T> =>
  Object.freeze({ tuples: Object.freeze([...tuples]) });

export const typedEmptyRelation = <T>(): TypedRelation<T> => typedRelation<T>([]);

export const typedUnion = <T>(left: TypedRelation<T>, right: TypedRelation<T>): TypedRelation<T> =>
  typedRelation([...left.tuples, ...right.tuples]);

export const typedProject = <A, B>(
  source: TypedRelation<A>,
  operation: (value: A, index: number) => B,
): TypedRelation<B> => {
  const visit = (index: number, output: readonly B[]): readonly B[] =>
    relationOptionFold(
      relationAt(source.tuples, index),
      () => output,
      value => visit(index + 1, [...output, operation(value, index)]),
    );
  return typedRelation(visit(0, []));
};

export function typedSelect<T, S extends T>(
  source: TypedRelation<T>,
  predicate: (value: T, index: number, source: TypedRelation<T>) => value is S,
): TypedRelation<S>;
export function typedSelect<T>(
  source: TypedRelation<T>,
  predicate: (value: T, index: number, source: TypedRelation<T>) => boolean,
): TypedRelation<T>;
export function typedSelect<T>(
  source: TypedRelation<T>,
  predicate: (value: T, index: number, source: TypedRelation<T>) => boolean,
): TypedRelation<T> {
  const visit = (index: number, output: readonly T[]): readonly T[] =>
    relationOptionFold(
      relationAt(source.tuples, index),
      () => output,
      value => relationResolve(
        predicate(value, index, source),
        () => visit(index + 1, [...output, value]),
        () => visit(index + 1, output),
      ),
    );
  return typedRelation(visit(0, []));
}

export const typedExpand = <A, B>(
  source: TypedRelation<A>,
  operation: (value: A, index: number) => TypedRelation<B>,
): TypedRelation<B> => {
  const visit = (index: number, output: TypedRelation<B>): TypedRelation<B> =>
    relationOptionFold(
      relationAt(source.tuples, index),
      () => output,
      value => visit(index + 1, typedUnion(output, operation(value, index))),
    );
  return visit(0, typedEmptyRelation<B>());
};

export const typedDefine = <A, B>(
  source: readonly A[],
  operation: (value: A, index: number) => B,
): readonly B[] => typedProject(typedRelation(source), operation).tuples;

export const typedDistinct = <T>(
  source: TypedRelation<T>,
  key: (value: T) => string,
): TypedRelation<T> => {
  const visit = (
    index: number,
    seen: RelationMembership<string>,
    output: readonly T[],
  ): readonly T[] =>
    relationOptionFold(
      relationAt(source.tuples, index),
      () => output,
      value => relationResolve(
        relationContains(seen, key(value)),
        () => visit(index + 1, seen, output),
        () => visit(index + 1, relationInsert(seen, key(value)), [...output, value]),
      ),
    );
  return typedRelation(visit(0, [], []));
};

export const typedJoin = <A, B, K>(
  left: TypedRelation<A>,
  right: TypedRelation<B>,
  leftKey: (value: A) => K,
  rightKey: (value: B) => K,
  combine: (leftValue: A, rightValue: B) => B,
): TypedRelation<B> => {
  const matchingRight = (leftValue: A): readonly B[] =>
    typedSelect(right, value => Object.is(leftKey(leftValue), rightKey(value))).tuples;

  const emitRight = (
    leftValue: A,
    candidates: readonly B[],
    candidateIndex: number,
    output: readonly B[],
  ): readonly B[] =>
    relationOptionFold(
      relationAt(candidates, candidateIndex),
      () => output,
      value => emitRight(leftValue, candidates, candidateIndex + 1, [...output, combine(leftValue, value)]),
    );

  const emit = (index: number, output: readonly B[]): readonly B[] =>
    relationOptionFold(
      relationAt(left.tuples, index),
      () => output,
      value => emit(index + 1, emitRight(value, matchingRight(value), 0, output)),
    );

  return typedRelation(emit(0, []));
};
