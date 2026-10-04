/**
 * Declarative membership algebra.
 *
 * Host Set/Map state is deliberately absent from semantic layers. Membership is
 * represented as a relation (an immutable tuple stream) and queried through
 * relation predicates.
 */
import { relationEqual, relationResolve, relationNone, relationSome, type RelationOption } from './relationFoundation';

export type RelationMembership<T> = readonly T[];

export const relationContains = <T>(values: RelationMembership<T>, value: T, index = 0): boolean =>
  relationResolve(
    relationEqual(index, values.length),
    () => false,
    () => relationResolve(
      relationEqual(values[index], value),
      () => true,
      () => relationContains(values, value, index + 1),
    ),
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
    () => relationUnique(values, index + 1, relationInsert(output, values[index])),
  );

export const relationRemove = <T>(values: RelationMembership<T>, value: T, index = 0, output: T[] = []): RelationMembership<T> =>
  relationResolve(
    relationEqual(index, values.length),
    () => Object.freeze(output),
    () => relationRemove(values, value, index + 1, relationResolve(relationEqual(values[index], value), () => output, () => [...output, values[index]])),
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
  () => relationResolve(
    relationEqual(entries[index][0], key),
    () => relationSome(entries[index][1]),
    () => relationIndexLookup(entries, key, index + 1),
  ),
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
    relationResolve(
      relationEqual(entries[index][0], key),
      () => output,
      () => [...output, entries[index]],
    ),
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

