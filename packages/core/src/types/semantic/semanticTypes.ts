/**
 * semanticTypes.ts
 *
 * Semantic type vocabulary, immutable field sets, and semantic nodes.
 *
 * @module core/types/semantic
 */

import type { SemanticResolution } from '../contract';
import type { PropertyName } from '../domain/semanticValues';

export type SemanticType = import("../../compiler/types/SemanticType").SemanticType

export interface SemanticFieldEntry {
  readonly name: PropertyName;
  readonly type: SemanticType;
}

export class SemanticFieldSet implements Iterable<SemanticFieldEntry> {
  public readonly entries: readonly SemanticFieldEntry[];
  private readonly _lookup: ReadonlyMap<string, SemanticType>;

  constructor(entries: readonly SemanticFieldEntry[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<string, SemanticType>();
    for (const e of entries) {
      map.set(e.name, e.type);
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

  public get(name: PropertyName): SemanticType | undefined {
    return this._lookup.get(name);
  }

  public getType(name: PropertyName): SemanticType | undefined {
    return this._lookup.get(name);
  }

  public has(name: PropertyName): boolean {
    return this._lookup.has(name);
  }

  public hasField(name: PropertyName): boolean {
    return this._lookup.has(name);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<SemanticFieldEntry> {
    return this.entries[Symbol.iterator]();
  }

}

export interface SemanticNode extends Omit<SemanticResolution, 'fields'> {
  type: SemanticType;
  fields?: SemanticFieldSet;
}
