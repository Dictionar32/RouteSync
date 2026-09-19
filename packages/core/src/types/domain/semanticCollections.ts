/**
 * Semantic Domain Collection Maps (Pure Encapsulated Collection ADTs)
 *
 * Dedicated Value Objects replacing naked Record in Semantic IR.
 * Conforms to Rule 8, 10, 11, and 12: Complete Contracts (0 '?', 0 'null'),
 * 0 'any', 0 naked Record, and pure encapsulation via private ReadonlyMap.
 *
 * @module types/domain/semanticCollections
 */

import type { SemanticType } from '../../compiler/types/SemanticType';
import type { EloquentRelationType } from './eloquentTypes';
import type { Nullability } from './modelContracts';
import { SemanticValueFactory } from './semanticValues';
import type { ColumnName, ModelName, RelationName, PropertyName, VariableName, MethodName } from './semanticValues';

/**
 * Model Field Column Metadata
 */
export interface ModelFieldInfo {
  readonly type: SemanticType;
  readonly nullability: Nullability;
}

export interface ModelFieldEntry {
  readonly column: ColumnName;
  readonly info: ModelFieldInfo;
}

export class ModelFieldMap implements Iterable<ModelFieldEntry> {
  public readonly entries: readonly ModelFieldEntry[];
  private readonly _lookup: ReadonlyMap<ColumnName, ModelFieldInfo>;

  constructor(entries: readonly ModelFieldEntry[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<ColumnName, ModelFieldInfo>();
    for (const e of entries) {
      map.set(e.column, e.info);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty(): ModelFieldMap {
    return new ModelFieldMap([]);
  }

  public static fromObject(record: Readonly<{ readonly [column: string]: ModelFieldInfo }>): ModelFieldMap {
    const entries: ModelFieldEntry[] = Object.entries(record).map(([column, info]) => ({
      column: SemanticValueFactory.columnName(column),
      info
    }));
    return new ModelFieldMap(entries);
  }

  public static fromRecord(record: Readonly<{ readonly [column: string]: ModelFieldInfo }>): ModelFieldMap {
    return ModelFieldMap.fromObject(record);
  }

  public static fromEntries(entries: readonly ModelFieldEntry[]): ModelFieldMap {
    return new ModelFieldMap(entries);
  }

  public get(column: ColumnName): ModelFieldInfo | undefined {
    return this._lookup.get(column);
  }

  public has(column: ColumnName): boolean {
    return this._lookup.has(column);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<ModelFieldEntry> {
    return this.entries[Symbol.iterator]();
  }

  public entriesIterator(): IterableIterator<[ColumnName, ModelFieldInfo]> {
    return this._lookup.entries();
  }

  public toObject(): { readonly [column: string]: ModelFieldInfo } {
    const rec: { [column: string]: ModelFieldInfo } = {};
    for (const e of this.entries) {
      rec[e.column.value] = e.info;
    }
    return rec;
  }

  public toRecord(): { readonly [column: string]: ModelFieldInfo } {
    return this.toObject();
  }
}

/**
 * Model Relation Metadata
 */
export interface ModelRelationInfo {
  readonly type: EloquentRelationType;
  readonly model: ModelName;
}

export interface ModelRelationEntry {
  readonly relationName: RelationName;
  readonly info: ModelRelationInfo;
}

export class ModelRelationMap implements Iterable<ModelRelationEntry> {
  public readonly entries: readonly ModelRelationEntry[];
  private readonly _lookup: ReadonlyMap<RelationName, ModelRelationInfo>;

  constructor(entries: readonly ModelRelationEntry[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<RelationName, ModelRelationInfo>();
    for (const e of entries) {
      map.set(e.relationName, e.info);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty(): ModelRelationMap {
    return new ModelRelationMap([]);
  }

  public static fromObject(record: Readonly<{ readonly [relationName: string]: ModelRelationInfo }>): ModelRelationMap {
    const entries: ModelRelationEntry[] = Object.entries(record).map(([relationName, info]) => ({
      relationName: SemanticValueFactory.relationName(relationName),
      info
    }));
    return new ModelRelationMap(entries);
  }

  public static fromRecord(record: Readonly<{ readonly [relationName: string]: ModelRelationInfo }>): ModelRelationMap {
    return ModelRelationMap.fromObject(record);
  }

  public static fromEntries(entries: readonly ModelRelationEntry[]): ModelRelationMap {
    return new ModelRelationMap(entries);
  }

  public get(relationName: RelationName): ModelRelationInfo | undefined {
    return this._lookup.get(relationName);
  }

  public has(relationName: RelationName): boolean {
    return this._lookup.has(relationName);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<ModelRelationEntry> {
    return this.entries[Symbol.iterator]();
  }

  public entriesIterator(): IterableIterator<[RelationName, ModelRelationInfo]> {
    return this._lookup.entries();
  }

  public toObject(): { readonly [relationName: string]: ModelRelationInfo } {
    const rec: { [relationName: string]: ModelRelationInfo } = {};
    for (const e of this.entries) {
      rec[e.relationName.value] = e.info;
    }
    return rec;
  }

  public toRecord(): { readonly [relationName: string]: ModelRelationInfo } {
    return this.toObject();
  }
}

/**
 * Model Accessor Metadata Entry
 */
export interface ModelAccessorInfo<TSource, TAst, TSemantic> {
  readonly source: TSource;
  readonly ast: TAst;
  readonly semantic: TSemantic;
}

export interface ModelAccessorEntry<T> {
  readonly name: string;
  readonly accessor: T;
}

export class ModelAccessorMap<T> implements Iterable<ModelAccessorEntry<T>> {
  public readonly entries: readonly ModelAccessorEntry<T>[];
  private readonly _lookup: ReadonlyMap<string, T>;

  constructor(entries: readonly ModelAccessorEntry<T>[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<string, T>();
    for (const e of entries) {
      map.set(e.name, e.accessor);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty<T>(): ModelAccessorMap<T> {
    return new ModelAccessorMap<T>([]);
  }

  public static fromObject<T>(record: Readonly<{ readonly [name: string]: T }>): ModelAccessorMap<T> {
    const entries: ModelAccessorEntry<T>[] = Object.entries(record).map(([name, accessor]) => ({
      name,
      accessor
    }));
    return new ModelAccessorMap<T>(entries);
  }

  public static fromRecord <TValue>(record: Readonly<{ readonly [name: string]: TValue }>): ModelAccessorMap<TValue> {
    return ModelAccessorMap.fromObject<TValue>(record);
  }

  public static fromEntries<T>(entries: readonly ModelAccessorEntry<T>[]): ModelAccessorMap<T> {
    return new ModelAccessorMap<T>(entries);
  }

  public get(name: string): T | undefined {
    return this._lookup.get(name);
  }

  public has(name: string): boolean {
    return this._lookup.has(name);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<ModelAccessorEntry<T>> {
    return this.entries[Symbol.iterator]();
  }

  public entriesIterator(): IterableIterator<[string, T]> {
    return this._lookup.entries();
  }

  public toObject(): { readonly [name: string]: T } {
    const rec: { [name: string]: T } = {};
    for (const e of this.entries) {
      rec[e.name] = e.accessor;
    }
    return rec;
  }

  public toRecord(): { readonly [name: string]: T } {
    return this.toObject();
  }
}

/**
 * Service Node Map for ServiceGraph
 */
export interface ModelServiceEntry<T> {
  readonly name: string;
  readonly service: T;
}

export class ModelServiceMap<T> implements Iterable<ModelServiceEntry<T>> {
  public readonly entries: readonly ModelServiceEntry<T>[];
  private readonly _lookup: ReadonlyMap<string, T>;

  constructor(entries: readonly ModelServiceEntry<T>[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<string, T>();
    for (const e of entries) {
      map.set(e.name, e.service);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty<T>(): ModelServiceMap<T> {
    return new ModelServiceMap<T>([]);
  }

  public static fromObject<T>(record: Readonly<{ readonly [name: string]: T }>): ModelServiceMap<T> {
    const entries: ModelServiceEntry<T>[] = Object.entries(record).map(([name, service]) => ({
      name,
      service
    }));
    return new ModelServiceMap<T>(entries);
  }

  public static fromRecord <TValue>(record: Readonly<{ readonly [name: string]: TValue }>): ModelServiceMap<TValue> {
    return ModelServiceMap.fromObject<TValue>(record);
  }

  public static fromEntries<T>(entries: readonly ModelServiceEntry<T>[]): ModelServiceMap<T> {
    return new ModelServiceMap<T>(entries);
  }

  public get(name: string): T | undefined {
    return this._lookup.get(name);
  }

  public has(name: string): boolean {
    return this._lookup.has(name);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<ModelServiceEntry<T>> {
    return this.entries[Symbol.iterator]();
  }

  public entriesIterator(): IterableIterator<[string, T]> {
    return this._lookup.entries();
  }

  public toObject(): { readonly [name: string]: T } {
    const rec: { [name: string]: T } = {};
    for (const e of this.entries) {
      rec[e.name] = e.service;
    }
    return rec;
  }

  public toRecord(): { readonly [name: string]: T } {
    return this.toObject();
  }
}

/**
 * Controller Node Map for ServiceGraph
 */
export interface ModelControllerEntry<T> {
  readonly name: string;
  readonly controller: T;
}

export class ModelControllerMap<T> implements Iterable<ModelControllerEntry<T>> {
  public readonly entries: readonly ModelControllerEntry<T>[];
  private readonly _lookup: ReadonlyMap<string, T>;

  constructor(entries: readonly ModelControllerEntry<T>[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<string, T>();
    for (const e of entries) {
      map.set(e.name, e.controller);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty<T>(): ModelControllerMap<T> {
    return new ModelControllerMap<T>([]);
  }

  public static fromObject<T>(record: Readonly<{ readonly [name: string]: T }>): ModelControllerMap<T> {
    const entries: ModelControllerEntry<T>[] = Object.entries(record).map(([name, controller]) => ({
      name,
      controller
    }));
    return new ModelControllerMap<T>(entries);
  }

  public static fromRecord <TValue>(record: Readonly<{ readonly [name: string]: TValue }>): ModelControllerMap<TValue> {
    return ModelControllerMap.fromObject<TValue>(record);
  }

  public static fromEntries<T>(entries: readonly ModelControllerEntry<T>[]): ModelControllerMap<T> {
    return new ModelControllerMap<T>(entries);
  }

  public get(name: string): T | undefined {
    return this._lookup.get(name);
  }

  public has(name: string): boolean {
    return this._lookup.has(name);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<ModelControllerEntry<T>> {
    return this.entries[Symbol.iterator]();
  }

  public entriesIterator(): IterableIterator<[string, T]> {
    return this._lookup.entries();
  }

  public toObject(): { readonly [name: string]: T } {
    const rec: { [name: string]: T } = {};
    for (const e of this.entries) {
      rec[e.name] = e.controller;
    }
    return rec;
  }

  public toRecord(): { readonly [name: string]: T } {
    return this.toObject();
  }
}

/**
 * Model Node Map for ServiceGraph
 */
export interface ModelNodeEntry<T> {
  readonly name: string;
  readonly model: T;
}

export class ModelNodeMap<T> implements Iterable<ModelNodeEntry<T>> {
  public readonly entries: readonly ModelNodeEntry<T>[];
  private readonly _lookup: ReadonlyMap<string, T>;

  constructor(entries: readonly ModelNodeEntry<T>[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<string, T>();
    for (const e of entries) {
      map.set(e.name, e.model);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty<T>(): ModelNodeMap<T> {
    return new ModelNodeMap<T>([]);
  }

  public static fromObject<T>(record: Readonly<{ readonly [name: string]: T }>): ModelNodeMap<T> {
    const entries: ModelNodeEntry<T>[] = Object.entries(record).map(([name, model]) => ({
      name,
      model
    }));
    return new ModelNodeMap<T>(entries);
  }

  public static fromRecord <TValue>(record: Readonly<{ readonly [name: string]: TValue }>): ModelNodeMap<TValue> {
    return ModelNodeMap.fromObject<TValue>(record);
  }

  public static fromEntries<T>(entries: readonly ModelNodeEntry<T>[]): ModelNodeMap<T> {
    return new ModelNodeMap<T>(entries);
  }

  public get(name: string): T | undefined {
    return this._lookup.get(name);
  }

  public has(name: string): boolean {
    return this._lookup.has(name);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<ModelNodeEntry<T>> {
    return this.entries[Symbol.iterator]();
  }

  public entriesIterator(): IterableIterator<[string, T]> {
    return this._lookup.entries();
  }

  public toObject(): { readonly [name: string]: T } {
    const rec: { [name: string]: T } = {};
    for (const e of this.entries) {
      rec[e.name] = e.model;
    }
    return rec;
  }

  public toRecord(): { readonly [name: string]: T } {
    return this.toObject();
  }
}

/**
 * Semantic Model Map for IRContext
 */
export interface SemanticModelEntry<T> {
  readonly modelName: string;
  readonly modelType: T;
}

export class SemanticModelMap<T> implements Iterable<SemanticModelEntry<T>> {
  public readonly entries: readonly SemanticModelEntry<T>[];
  private readonly _lookup: ReadonlyMap<string, T>;

  constructor(entries: readonly SemanticModelEntry<T>[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<string, T>();
    for (const e of entries) {
      map.set(e.modelName, e.modelType);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty<T>(): SemanticModelMap<T> {
    return new SemanticModelMap<T>([]);
  }

  public static fromObject<T>(record: Readonly<{ readonly [modelName: string]: T }>): SemanticModelMap<T> {
    const entries: SemanticModelEntry<T>[] = Object.entries(record).map(([modelName, modelType]) => ({
      modelName,
      modelType
    }));
    return new SemanticModelMap<T>(entries);
  }

  public static fromRecord <TValue>(record: Readonly<{ readonly [modelName: string]: TValue }>): SemanticModelMap<TValue> {
    return SemanticModelMap.fromObject<TValue>(record);
  }

  public static fromEntries<T>(entries: readonly SemanticModelEntry<T>[]): SemanticModelMap<T> {
    return new SemanticModelMap<T>(entries);
  }

  public get(modelName: string): T | undefined {
    return this._lookup.get(modelName);
  }

  public has(modelName: string): boolean {
    return this._lookup.has(modelName);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<SemanticModelEntry<T>> {
    return this.entries[Symbol.iterator]();
  }

  public entriesIterator(): IterableIterator<[string, T]> {
    return this._lookup.entries();
  }

  public toObject(): { readonly [modelName: string]: T } {
    const rec: { [modelName: string]: T } = {};
    for (const e of this.entries) {
      rec[e.modelName] = e.modelType;
    }
    return rec;
  }

  public toRecord(): { readonly [modelName: string]: T } {
    return this.toObject();
  }
}

/**
 * Semantic Relation Map for IRContext
 */
export interface SemanticRelationEntry<T> {
  readonly relationName: string;
  readonly relation: T;
}

export class SemanticRelationMap<T> implements Iterable<SemanticRelationEntry<T>> {
  public readonly entries: readonly SemanticRelationEntry<T>[];
  private readonly _lookup: ReadonlyMap<string, T>;

  constructor(entries: readonly SemanticRelationEntry<T>[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<string, T>();
    for (const e of entries) {
      map.set(e.relationName, e.relation);
    }
    this._lookup = map;
    Object.freeze(this);
  }

  public static empty<T>(): SemanticRelationMap<T> {
    return new SemanticRelationMap<T>([]);
  }

  public static fromObject<T>(record: Readonly<{ readonly [relationName: string]: T }>): SemanticRelationMap<T> {
    const entries: SemanticRelationEntry<T>[] = Object.entries(record).map(([relationName, relation]) => ({
      relationName,
      relation
    }));
    return new SemanticRelationMap<T>(entries);
  }

  public static fromRecord <TValue>(record: Readonly<{ readonly [relationName: string]: TValue }>): SemanticRelationMap<TValue> {
    return SemanticRelationMap.fromObject<TValue>(record);
  }

  public static fromEntries<T>(entries: readonly SemanticRelationEntry<T>[]): SemanticRelationMap<T> {
    return new SemanticRelationMap<T>(entries);
  }

  public get(relationName: string): T | undefined {
    return this._lookup.get(relationName);
  }

  public has(relationName: string): boolean {
    return this._lookup.has(relationName);
  }

  public get size(): number {
    return this._lookup.size;
  }

  public [Symbol.iterator](): Iterator<SemanticRelationEntry<T>> {
    return this.entries[Symbol.iterator]();
  }

  public entriesIterator(): IterableIterator<[string, T]> {
    return this._lookup.entries();
  }

  public toObject(): { readonly [relationName: string]: T } {
    const rec: { [relationName: string]: T } = {};
    for (const e of this.entries) {
      rec[e.relationName] = e.relation;
    }
    return rec;
  }

  public toRecord(): { readonly [relationName: string]: T } {
    return this.toObject();
  }
}
