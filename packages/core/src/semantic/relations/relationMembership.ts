/**
 * Declarative membership algebra.
 *
 * Host Set/Map state is deliberately absent from semantic layers. Membership is
 * represented as a relation (an immutable tuple stream) and queried through
 * relation predicates.
 */
import { relationEqual, relationResolve, relationNone, relationSome, relationOptionFold, relationAll, type RelationOption } from './relationFoundation';

export type RelationMembership<T> = readonly T[];

export const relationContains = <T>(values: RelationMembership<T>, value: T, index = 0): boolean =>
  relationResolve(
    relationEqual(index, values.length),
    () => false,
    () => relationOptionFold(
      relationAt(values, index),
      () => false,
      candidate => relationResolve(relationEqual(candidate, value), () => true, () => relationContains(values, value, index + 1)),
    ),
  );

export const relationAt = <T>(values: readonly T[], index: number): RelationOption<T> =>
  relationResolve(
    relationAll([index >= 0, index < values.length]),
    () => values.slice(index, index + 1).reduce<RelationOption<T>>((_, candidate) => relationSome(candidate), relationNone<T>()),
    () => relationNone<T>(),
  );

export const relationInsert = <T>(values: RelationMembership<T>, value: T): RelationMembership<T> =>
  relationResolve(
    relationContains(values, value),
    () => values,
    () => Object.freeze([...values, value]),
  );

export const relationUnique = <T>(values: readonly T[], index = 0, output: RelationMembership<T> = []): RelationMembership<T> =>
  relationResolve(
    relationEqual(index, values.length),
    () => Object.freeze(output),
    () => relationOptionFold(relationAt(values, index), () => output, value => relationUnique(values, index + 1, relationInsert(output, value))),
  );

export const relationRemove = <T>(values: RelationMembership<T>, value: T, index = 0, output: T[] = []): RelationMembership<T> =>
  relationResolve(
    relationEqual(index, values.length),
    () => Object.freeze(output),
    () => relationOptionFold(relationAt(values, index), () => output, candidate => relationRemove(values, value, index + 1, relationResolve(relationEqual(candidate, value), () => output, () => [...output, candidate]))),
  );

/**
 * Relation-backed keyed storage. This is the canonical replacement for host
 * Map state in semantic/scanner layers: facts remain immutable tuples and all
 * lookup/update semantics flow through the relation algebra.
 */
export type RelationIndex<K, V> = readonly (readonly [K, V])[];

export const relationIndexLookup = <K, V>(
  entries: RelationIndex<K, V>,
  key: K,
  index = 0,
): RelationOption<V> => relationResolve(
  relationEqual(index, entries.length),
  () => relationNone<V>(),
  () => relationOptionFold(relationAt(entries, index), () => relationNone<V>(), entry =>
    relationResolve(relationEqual(entry[0], key), () => relationSome(entry[1]), () => relationIndexLookup(entries, key, index + 1))),
);


const relationIndexWithout = <K, V>(
  entries: RelationIndex<K, V>,
  key: K,
  index = 0,
  output: RelationIndex<K, V> = [],
): RelationIndex<K, V> => relationResolve(
  relationEqual(index, entries.length),
  () => output,
  () => relationIndexWithout(
    entries,
    key,
    index + 1,
    relationOptionFold(relationAt(entries, index), () => output, entry =>
      relationResolve(relationEqual(entry[0], key), () => output, () => [...output, entry])),
  ),
);

export const relationIndexAdd = <K, V>(
  entries: RelationIndex<K, V>,
  key: K,
  value: V,
): RelationIndex<K, V> => Object.freeze([
  ...relationIndexWithout(entries, key),
  [key, value] as const,
]);

