import type { Lookup } from '../../types/upstream/collections';
import type { ModelReference, ServiceReference } from '../../types/upstream/semanticReferences';

export type GraphNodeReference = ModelReference | ServiceReference;

export type GraphNodeEntry<T> = {
  readonly reference: GraphNodeReference;
  readonly value: T;
};

const referenceKey = (reference: GraphNodeReference): string =>
  `${reference.kind}:${reference.name.value.value}`;

export class GraphNodeIndex<T> implements Iterable<GraphNodeEntry<T>> {
  private entries: readonly GraphNodeEntry<T>[];
  private lookupIndex: ReadonlyMap<string, T>;
  private references: ReadonlyMap<string, GraphNodeReference>;

  public constructor(entries: readonly GraphNodeEntry<T>[]) {
    this.entries = Object.freeze([...entries]);
    const values = new Map<string, T>();
    const refs = new Map<string, GraphNodeReference>();
    for (const entry of entries) {
      const key = referenceKey(entry.reference);
      values.set(key, entry.value);
      refs.set(key, entry.reference);
    }
    this.lookupIndex = values;
    this.references = refs;
  }

  public static empty<T>(): GraphNodeIndex<T> {
    return new GraphNodeIndex<T>([]);
  }

  public set(reference: GraphNodeReference, value: T): void {
    const key = referenceKey(reference);
    const next = this.entries.filter(entry => referenceKey(entry.reference) !== key);
    this.entries = Object.freeze([...next, { reference, value }]);
    const values = new Map<string, T>();
    const refs = new Map<string, GraphNodeReference>();
    for (const entry of this.entries) {
      const entryKey = referenceKey(entry.reference);
      values.set(entryKey, entry.value);
      refs.set(entryKey, entry.reference);
    }
    this.lookupIndex = values;
    this.references = refs;
  }

  public lookup(reference: GraphNodeReference): Lookup<T> {
    const value = this.lookupIndex.get(referenceKey(reference));
    return value === undefined ? { kind: 'missing' } : { kind: 'found', value };
  }

  public has(reference: GraphNodeReference): boolean {
    return this.lookupIndex.has(referenceKey(reference));
  }

  public get size(): number {
    return this.lookupIndex.size;
  }

  public [Symbol.iterator](): Iterator<GraphNodeEntry<T>> {
    return this.entries[Symbol.iterator]();
  }

  public referencesIterator(): IterableIterator<GraphNodeReference> {
    return this.references.values();
  }
}
