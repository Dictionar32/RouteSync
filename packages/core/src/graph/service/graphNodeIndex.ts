import type { ClassReference, ModelReference, ServiceReference } from '../../types/upstream/semanticReferences';

export type GraphNodeReference = ClassReference | ModelReference | ServiceReference;
export type GraphNodeEntry<T> = { readonly reference: GraphNodeReference; readonly value: T };

type GraphNodeState<T> = Readonly<{
  readonly entries: readonly GraphNodeEntry<T>[];
}>;

const referenceKey = (reference: GraphNodeReference): string =>
  `${reference.kind}:${reference.name.value.value}`;

const replaceEntry = <T>(
  entries: readonly GraphNodeEntry<T>[],
  reference: GraphNodeReference,
  value: T,
): readonly GraphNodeEntry<T>[] => {
  const key = referenceKey(reference);
  const retained = entries.filter(entry => referenceKey(entry.reference) !== key);
  return Object.freeze([...retained, { reference, value }]);
};

const lookupEntry = <T>(
  entries: readonly GraphNodeEntry<T>[],
  reference: GraphNodeReference,
): Lookup<T> => {
  const key = referenceKey(reference);
  const entry = entries.find(candidate => referenceKey(candidate.reference) === key);
  return entry === undefined
    ? { kind: 'missing' }
    : { kind: 'found', value: entry.value };
};

const create = <T>(initial: readonly GraphNodeEntry<T>[]): GraphNodeIndex<T> => {
  let state: GraphNodeState<T> = Object.freeze({ entries: Object.freeze([...initial]) });
  const api: GraphNodeIndex<T> = {
    set: (reference, value) => {
      state = Object.freeze({ entries: replaceEntry(state.entries, reference, value) });
    },
    lookup: reference => lookupEntry(state.entries, reference),
    has: reference => matchLookup(lookupEntry(state.entries, reference), {
      missing: () => false,
      found: () => true,
    }),
    get size() { return state.entries.length; },
    [Symbol.iterator]: () => state.entries[Symbol.iterator](),
    referencesIterator: () => state.entries.map(entry => entry.reference)[Symbol.iterator](),
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
