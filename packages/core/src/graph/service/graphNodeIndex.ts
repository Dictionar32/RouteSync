import type { Lookup } from '../../types/upstream/collections';
import type { ClassReference, ModelReference, ServiceReference } from '../../types/upstream/semanticReferences';
import { relationNotEqual, relationProject, relationSelect } from '../../semantic/foundation/relationalSequence';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../semantic/foundation/relationMembership';
import { relationOptionFold } from '../../semantic/foundation/relationalSequence';

export type GraphNodeReference = ClassReference | ModelReference | ServiceReference;
export type GraphNodeEntry<T> = { readonly reference: GraphNodeReference; readonly value: T };

type GraphNodeState<T> = Readonly<{
  readonly entries: readonly GraphNodeEntry<T>[];
  readonly values: RelationIndex<string, T>;
  readonly references: RelationIndex<string, GraphNodeReference>;
}>;

const referenceKey = (reference: GraphNodeReference): string =>
  `${reference.kind}:${reference.name.value.value}`;

const replaceEntry = <T>(
  entries: readonly GraphNodeEntry<T>[],
  reference: GraphNodeReference,
  value: T,
): readonly GraphNodeEntry<T>[] => {
  const key = referenceKey(reference);
  const retained = relationSelect(entries, entry => relationNotEqual(referenceKey(entry.reference), key));
  return Object.freeze([...retained, { reference, value }]);
};

const projectIndexes = <T>(entries: readonly GraphNodeEntry<T>[]): GraphNodeState<T> => {
  const values = relationProject(entries, entry => [referenceKey(entry.reference), entry.value] as const);
  const references = relationProject(entries, entry => [referenceKey(entry.reference), entry.reference] as const);
  return Object.freeze({ entries: Object.freeze([...entries]), values, references });
};

const create = <T>(initial: readonly GraphNodeEntry<T>[]): GraphNodeIndex<T> => {
  let state = projectIndexes(initial);
  const api: GraphNodeIndex<T> = {
    set: (reference, value) => {
      const entries = replaceEntry(state.entries, reference, value);
      state = projectIndexes(entries);
    },
    lookup: reference => relationOptionFold(
      relationIndexLookup(state.values, referenceKey(reference)),
      () => ({ kind: 'missing' } as const),
      value => ({ kind: 'found', value } as const),
    ),
    has: reference => relationOptionFold(
      relationIndexLookup(state.values, referenceKey(reference)),
      () => false,
      () => true,
    ),
    get size() { return state.entries.length; },
    [Symbol.iterator]: () => state.entries[Symbol.iterator](),
    referencesIterator: () => relationProject(state.references, entry => entry[1])[Symbol.iterator](),
  };
  return api;
};

export interface GraphNodeIndex<T> extends Iterable<GraphNodeEntry<T>> {
  readonly set: (reference: GraphNodeReference, value: T) => void;
  readonly lookup: (reference: GraphNodeReference) => Lookup<T>;
  readonly has: (reference: GraphNodeReference) => boolean;
  readonly size: number;
  readonly referencesIterator: () => IterableIterator<GraphNodeReference>;
}

export const GraphNodeIndex = Object.freeze({
  empty: <T>(): GraphNodeIndex<T> => create<T>([]),
  fromEntries: <T>(entries: readonly GraphNodeEntry<T>[]): GraphNodeIndex<T> => create(entries),
});
