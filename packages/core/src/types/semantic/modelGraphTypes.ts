/**
 * modelGraphTypes.ts
 *
 * Service-graph model node descriptors, Eloquent cast collections, and dependencies.
 *
 * @module core/types/semantic
 */

import type {
  ModelFieldMap,
  ModelRelationMap,
  ModelAccessorMap
} from '../domain/semanticCollections';

export type ExecutionLayer =
  | "controller"
  | "service"
  | "model"
  | "repository"
  | "unknown";

export interface ServiceDependency {
  readonly from: string;
  readonly to: string;
  readonly type: "calls" | "composes" | "depends_on_model" | "uses_repository";
  readonly relationKind?: string;
  readonly weight: number;
}

export interface ModelCastEntry {
  readonly column: string;
  readonly castType: string;
}

export class ModelCastCollection implements Iterable<ModelCastEntry> {
  public readonly casts: readonly ModelCastEntry[];
  private readonly _lookup: ReadonlyMap<string, string>;

  constructor(casts: readonly ModelCastEntry[]) {
    this.casts = Object.freeze([...casts]);
    const map = new Map<string, string>();
    for (const c of casts) {
      map.set(c.column, c.castType);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty(): ModelCastCollection {
    return new ModelCastCollection([]);
  }

  public static fromRecord(record: Readonly<{ readonly [column: string]: string }>): ModelCastCollection {
    const casts: ModelCastEntry[] = Object.entries(record).map(([column, castType]) => ({ column, castType }));
    return new ModelCastCollection(casts);
  }

  public static fromEntries(casts: readonly ModelCastEntry[]): ModelCastCollection {
    return new ModelCastCollection(casts);
  }

  public get(column: string): string | undefined { return this._lookup.get(column); }
  public getCast(column: string): string | undefined { return this._lookup.get(column); }
  public has(column: string): boolean { return this._lookup.has(column); }
  public hasCast(column: string): boolean { return this._lookup.has(column); }
  public get size(): number { return this._lookup.size; }
  public [Symbol.iterator](): Iterator<ModelCastEntry> { return this.casts[Symbol.iterator](); }
  public toRecord(): { readonly [column: string]: string } {
    return Object.fromEntries(this.casts.map(c => [c.column, c.castType]));
  }
}

export interface ServiceModelNode {
  kind: "model_node";
  name: string;
  table?: string;
  fields?: ModelFieldMap;
  relations?: ModelRelationMap;
  accessors?: ModelAccessorMap;
  casts?: ModelCastCollection;
  layer: "model";
  confidence: number;
}
