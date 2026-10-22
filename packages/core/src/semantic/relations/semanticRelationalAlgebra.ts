/**
 * Phase 321 — relational algebra over tagged semantic atoms.
 *
 * Relations are the semantic state. Absence is represented by an explicit
 * tagged atom; absence is never represented by a host-language sentinel.
 * Fixed-point closure evaluates recursive derivations.
 */
import {
  relationResolve,
  relationFirst,
  relationOptionMap,
  relationOptionValue,
} from './relationalSequence';
import { relationAny, relationEqual } from './semanticRelations';
import { relationContains as membershipContains, relationInsert, type RelationMembership } from './relationMembership';

export type RelationNoneAtom = Readonly<{ readonly kind: 'semantic_null' }>;
export const RELATION_NONE_ATOM: RelationNoneAtom = Object.freeze({ kind: 'semantic_null' });
export const semanticNullAtom: RelationNoneAtom = RELATION_NONE_ATOM;
export type RelationAtom = string | number | boolean | RelationNoneAtom;
/** Canonical atom authority consumed by the semantic relation/rewrite layers. */
export type SemanticRelationAtom = RelationAtom;
export type RelationTuple<A extends RelationAtom = RelationAtom> = readonly A[];
export type Relation<A extends RelationAtom = RelationAtom> = Readonly<{
  readonly tuples: readonly RelationTuple<A>[];
}>;
export type Delta<A extends RelationAtom = RelationAtom> = Readonly<{
  readonly recent: Relation<A>;
  readonly stable: Relation<A>;
}>;

const tupleKey = <A extends RelationAtom>(tuple: RelationTuple<A>, index = 0, output = ''): string =>
  relationResolve(
    index >= tuple.length,
    () => output,
    () => {
      const value = tuple[index];
      const encoded = relationResolve(relationEqual(output.length, 0), () => String(value), () => `${output}\u001f${String(value)}`);
      return tupleKey(tuple, index + 1, encoded);
    },
  );

const relationKey = <A extends RelationAtom>(tuple: RelationTuple<A>): string => JSON.stringify(tuple);
const projectTuples = <A, B>(source: readonly A[], projection: (value: A, index: number) => B, index = 0, output: readonly B[] = []): readonly B[] =>
  relationResolve(
    index >= source.length,
    () => output,
    () => projectTuples(source, projection, index + 1, [...output, projection(source[index], index)]),
  );

const selectTuples = <A>(source: readonly A[], predicate: (value: A, index: number) => boolean, index = 0, output: readonly A[] = []): readonly A[] =>
  relationResolve(
    index >= source.length,
    () => output,
    () => relationResolve(
      predicate(source[index], index),
      () => selectTuples(source, predicate, index + 1, [...output, source[index]]),
      () => selectTuples(source, predicate, index + 1, output),
    ),
  );


const uniqueRecursive = <A extends RelationAtom>(
  tuples: readonly RelationTuple<A>[],
  index = 0,
  seen: RelationMembership<string> = [],
  output: readonly RelationTuple<A>[] = [],
): readonly RelationTuple<A>[] =>
  relationResolve(
    index >= tuples.length,
    () => output,
    () => {
      const tuple = tuples[index];
      const key = relationKey(tuple);
      return relationResolve(
        membershipContains(seen, key),
        () => uniqueRecursive(tuples, index + 1, seen, output),
        () => uniqueRecursive(tuples, index + 1, relationInsert(seen, key), [...output, Object.freeze([...tuple])]),
      );
    },
  );

export const relation = <A extends RelationAtom>(tuples: readonly RelationTuple<A>[]): Relation<A> =>
  Object.freeze({ tuples: Object.freeze(uniqueRecursive(tuples)) });

export const emptyRelation = <A extends RelationAtom>(): Relation<A> => relation([]);

export const union = <A extends RelationAtom>(left: Relation<A>, right: Relation<A>): Relation<A> =>
  relation([...left.tuples, ...right.tuples]);

export const projectRelation = <A extends RelationAtom, B extends RelationAtom>(
  source: Relation<A>,
  operation: (tuple: RelationTuple<A>, index: number) => RelationTuple<B>,
): Relation<B> => {
  const projectAt = (index: number, output: readonly RelationTuple<B>[]): readonly RelationTuple<B>[] =>
    relationResolve(
      index >= source.tuples.length,
      () => output,
      () => projectAt(index + 1, [...output, operation(source.tuples[index], index)]),
    );
  return relation(projectAt(0, []));
};

export const join = <A extends RelationAtom, B extends RelationAtom, K extends RelationAtom>(
  left: Relation<A>,
  right: Relation<B>,
  leftKey: (tuple: RelationTuple<A>) => K,
  rightKey: (tuple: RelationTuple<B>) => K,
  combine: (leftTuple: RelationTuple<A>, rightTuple: RelationTuple<B>) => RelationTuple<A | B>,
): Relation<A | B> => {
  const emitRight = (
    leftTuple: RelationTuple<A>,
    candidates: readonly RelationTuple<B>[],
    index: number,
    output: readonly RelationTuple<A | B>[],
  ): readonly RelationTuple<A | B>[] =>
    relationResolve(
      index >= candidates.length,
      () => output,
      () => emitRight(leftTuple, candidates, index + 1, [...output, combine(leftTuple, candidates[index])]),
    );

  const emit = (index: number, output: readonly RelationTuple<A | B>[]): readonly RelationTuple<A | B>[] =>
    relationResolve(
      index >= left.tuples.length,
      () => output,
      () => {
        const leftTuple = left.tuples[index];
        const candidates = selectTuples(right.tuples, tuple => relationEqual(rightKey(tuple), leftKey(leftTuple)));
        return emit(index + 1, emitRight(leftTuple, candidates, 0, output));
      },
    );

  return relation(emit(0, []));
};

export const antiJoin = <A extends RelationAtom, B extends RelationAtom>(
  source: Relation<A>,
  blocker: Relation<B>,
  sourceKey: (tuple: RelationTuple<A>) => string,
  blockerKey: (tuple: RelationTuple<B>) => string,
): Relation<A> => {
  const blocked = projectTuples(blocker.tuples, blockerKey);
  const retainAt = (index: number, output: readonly RelationTuple<A>[]): readonly RelationTuple<A>[] =>
    relationResolve(
      index >= source.tuples.length,
      () => output,
      () => {
        const tuple = source.tuples[index];
        return relationResolve(
          membershipContains(blocked, sourceKey(tuple)),
          () => retainAt(index + 1, output),
          () => retainAt(index + 1, [...output, tuple]),
        );
      },
    );
  return relation(retainAt(0, []));
};

export const delta = <A extends RelationAtom>(stable: Relation<A>, recent: Relation<A>): Delta<A> =>
  Object.freeze({ stable, recent });

export const addDelta = <A extends RelationAtom>(state: Delta<A>, additions: Relation<A>): Delta<A> => {
  const nextStable = union(state.stable, state.recent);
  const nextRecent = antiJoin(additions, nextStable, tupleKey, tupleKey);
  return Object.freeze({ stable: nextStable, recent: nextRecent });
};

export const fixedPoint = <A extends RelationAtom>(
  seed: Relation<A>,
  derive: (state: Delta<A>) => Relation<A>,
  maxRounds = 128,
): Relation<A> => {
  const settle = (state: Delta<A>, round: number): Relation<A> => {
    const visible = Object.freeze({ stable: union(state.stable, state.recent), recent: state.recent });
    const next = addDelta(visible, derive(visible));
    return relationResolve(
      relationAny([relationEqual(next.recent.tuples.length, 0), round >= maxRounds]),
      () => union(next.stable, next.recent),
      () => settle(next, round + 1),
    );
  };
  return settle(delta(emptyRelation<A>(), seed), 0);
};

export const relationContains = <A extends RelationAtom>(
  source: Relation<A>,
  tuple: RelationTuple<A>,
  index = 0,
): boolean =>
  relationResolve(
    index >= source.tuples.length,
    () => false,
    () => relationResolve(relationEqual(relationKey(source.tuples[index]), relationKey(tuple)), () => true, () => relationContains(source, tuple, index + 1)),
  );

export const relationTupleKey = <A extends RelationAtom>(tuple: RelationTuple<A>): string => relationKey(tuple);

export const selectRelation = <A extends RelationAtom>(
  source: Relation<A>,
  predicate: (tuple: RelationTuple<A>, index: number, source: Relation<A>) => boolean,
): Relation<A> => {
  const selectAt = (index: number, output: readonly RelationTuple<A>[]): readonly RelationTuple<A>[] =>
    relationResolve(
      index >= source.tuples.length,
      () => output,
      () => relationResolve(
        predicate(source.tuples[index], index, source),
        () => selectAt(index + 1, [...output, source.tuples[index]]),
        () => selectAt(index + 1, output),
      ),
    );
  return relation(selectAt(0, []));
};

export const expandRelation = <A extends RelationAtom, B extends RelationAtom>(
  source: Relation<A>,
  operation: (tuple: RelationTuple<A>, index: number) => Relation<B>,
): Relation<B> => {
  const expandAt = (index: number, output: Relation<B>): Relation<B> =>
    relationResolve(
      index >= source.tuples.length,
      () => output,
      () => expandAt(index + 1, union(output, operation(source.tuples[index], index))),
    );
  return expandAt(0, emptyRelation<B>());
};
