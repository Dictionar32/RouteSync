/**
 * semanticTypes.ts
 *
 * Semantic type vocabulary, immutable field sets, and semantic nodes.
 *
 * @module core/types/semantic
 */

import type { SemanticResolution } from '../contract';

export type SemanticType =
  | "string"
  | "number"
  | "boolean"
  | "datetime"
  | "array"
  | "object"
  | "model"
  | "resource"
  | "collection"
  | "nullable"
  | "json-object"
  | "json-member"
  | "BinaryFile"
  | "NewAccessToken"
  | "unknown";

export interface SemanticFieldEntry {
  readonly name: string;
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

  public static fromRecord(record: Readonly<{ readonly [name: string]: SemanticType }>): SemanticFieldSet {
    const entries: SemanticFieldEntry[] = Object.entries(record).map(([name, type]) => ({ name, type }));
    return new SemanticFieldSet(entries);
  }

  public static fromEntries(entries: readonly SemanticFieldEntry[]): SemanticFieldSet {
    return new SemanticFieldSet(entries);
  }

  public get(name: string): SemanticType | undefined {
    return this._lookup.get(name);
  }

  public getType(name: string): SemanticType | undefined {
    return this._lookup.get(name);
  }

  public has(name: string): boolean {
    return this._lookup.has(name);
  }

  public hasField(name: string): boolean {
    return this._lookup.has(name);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<SemanticFieldEntry> {
    return this.entries[Symbol.iterator]();
  }

  public toRecord(): { readonly [name: string]: SemanticType } {
    return Object.fromEntries(this.entries.map(e => [e.name, e.type]));
  }
}

export interface SemanticNode extends Omit<SemanticResolution, 'fields'> {
  type: SemanticType;
  fields?: SemanticFieldSet;
}
