/**
 * Semantic type vocabulary and immutable semantic field indexes.
 *
 * Names remain semantic value objects at this boundary. Lookup absence is an
 * explicit ADT instead of `undefined`, so consumers do not have to infer
 * whether a missing field is an error, an absent member, or an empty value.
 */

import type { SemanticResolution } from '../contract';
import type { PropertyName } from '../domain/semanticValues';

export type SemanticType = import('../../compiler/types/SemanticType').SemanticType;

export interface SemanticFieldEntry {
  readonly name: PropertyName;
  readonly type: SemanticType;
}

export type SemanticFieldLookup =
  | { readonly kind: 'found'; readonly entry: SemanticFieldEntry }
  | { readonly kind: 'missing'; readonly name: PropertyName };

const fieldKey = (name: PropertyName): string => `${name.kind}:${name.value}`;

export class SemanticFieldSet implements Iterable<SemanticFieldEntry> {
  public readonly entries: readonly SemanticFieldEntry[];
  private readonly _lookup: ReadonlyMap<string, SemanticFieldEntry>;

  constructor(entries: readonly SemanticFieldEntry[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<string, SemanticFieldEntry>();
    for (const entry of entries) {
      map.set(fieldKey(entry.name), entry);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty(): SemanticFieldSet {
    return new SemanticFieldSet([]);
  }

  public static fromEntries(entries: readonly SemanticFieldEntry[]): SemanticFieldSet {
    return new SemanticFieldSet(entries);
  }

  public lookup(name: PropertyName): SemanticFieldLookup {
    const entry = this._lookup.get(fieldKey(name));
    return entry === undefined
      ? { kind: 'missing', name }
      : { kind: 'found', entry };
  }

  public getType(name: PropertyName): SemanticFieldLookup {
    return this.lookup(name);
  }

  public has(name: PropertyName): boolean {
    return this._lookup.has(fieldKey(name));
  }

  public hasField(name: PropertyName): boolean {
    return this.has(name);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<SemanticFieldEntry> {
    return this.entries[Symbol.iterator]();
  }
}

export interface SemanticNode extends Omit<SemanticResolution, 'fields'> {
  readonly type: SemanticType;
  readonly fields: SemanticFieldSet;
}
