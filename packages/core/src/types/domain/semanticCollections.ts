/** Immutable relation-backed semantic collections. */
import type { SemanticType } from '../../compiler/types/SemanticType';
import type { EloquentRelationType } from './eloquentTypes';
import type { Nullability } from './modelContracts';
import { SemanticValueFactory } from './semanticValues';
import type { ColumnName, ModelName, RelationName, PropertyName, VariableName, MethodName } from './semanticValues';
import type { Lookup } from '../upstream/collections';
import { relationOptionFold, relationProject, relationFold } from '../../semantic/kernel/relationalSequence';
import { relationIndexLookup, type RelationIndex } from '../../semantic/kernel/relationMembership';

export interface ModelFieldInfo { readonly type: SemanticType; readonly nullability: Nullability; }
export interface ModelFieldEntry { readonly column: ColumnName; readonly info: ModelFieldInfo; }
export interface ModelRelationInfo { readonly type: EloquentRelationType; readonly model: ModelName; }
export interface ModelRelationEntry { readonly relationName: RelationName; readonly info: ModelRelationInfo; }
export interface ModelAccessorInfo<TSource, TAst, TSemantic> { readonly source: TSource; readonly ast: TAst; readonly semantic: TSemantic; }
export interface ModelAccessorEntry<T> { readonly name: MethodName; readonly accessor: T; }
export interface ModelServiceEntry<T> { readonly name: PropertyName; readonly service: T; }
export interface ModelControllerEntry<T> { readonly name: VariableName; readonly controller: T; }
export interface ModelNodeEntry<T> { readonly name: ModelName; readonly node: T; }
export interface SemanticModelEntry<T> { readonly name: ModelName; readonly model: T; }
export interface SemanticRelationEntry<T> { readonly name: RelationName; readonly relation: T; }

type Catalog<E, K, V> = Readonly<{
  readonly entries: readonly E[];
  readonly empty: () => Catalog<E, K, V>;
  readonly fromEntries: (entries: readonly E[]) => Catalog<E, K, V>;
  readonly fromObject: (record: Readonly<{ readonly [key: string]: V }>) => Catalog<E, K, V>;
  readonly fromRecord: (record: Readonly<{ readonly [key: string]: V }>) => Catalog<E, K, V>;
  readonly lookup: (key: K) => Lookup<V>;
  readonly size: number;
  readonly entriesIterator: () => IterableIterator<readonly [K, V]>;
  readonly toObject: () => { readonly [key: string]: V };
  readonly toRecord: () => { readonly [key: string]: V };
  readonly [Symbol.iterator]: () => Iterator<E>;
}>;

type EntryCodec<E, K, V> = Readonly<{
  readonly key: (entry: E) => K;
  readonly value: (entry: E) => V;
  readonly entry: (key: string, value: V) => E;
  readonly keyText: (key: K) => string;
}>;

const stringValue = (value: { readonly value: { readonly value: string } }): string => value.value.value;
const catalog = <E, K, V>(entries: readonly E[], codec: EntryCodec<E, K, V>): Catalog<E, K, V> => {
  const frozenEntries = Object.freeze([...entries]);
  const indexed: RelationIndex<K, V> = Object.freeze(relationProject(frozenEntries, entry => [codec.key(entry), codec.value(entry)] as const));
  const fromEntries = (next: readonly E[]): Catalog<E, K, V> => catalog(next, codec);
  const fromObject = (record: Readonly<{ readonly [key: string]: V }>): Catalog<E, K, V> => fromEntries(relationProject(Object.entries(record), ([key, value]) => codec.entry(key, value)));
  const lookup = (key: K): Lookup<V> => relationOptionFold(relationIndexLookup(indexed, key), () => ({ kind: 'missing' as const }), value => ({ kind: 'found' as const, value }));
  const pairs = (): readonly (readonly [K, V])[] => relationProject(frozenEntries, entry => [codec.key(entry), codec.value(entry)] as const);
  const entriesIterator = (): IterableIterator<readonly [K, V]> => pairs()[Symbol.iterator]();
  const toObject = (): { readonly [key: string]: V } => relationFold(frozenEntries, {} as { [key: string]: V }, (output, entry) => ({ ...output, [codec.keyText(codec.key(entry))]: codec.value(entry) }));
  return Object.freeze({ entries: frozenEntries, empty: () => fromEntries([]), fromEntries, fromObject, fromRecord: fromObject, lookup, size: frozenEntries.length, entriesIterator, toObject, toRecord: toObject, [Symbol.iterator]: () => frozenEntries[Symbol.iterator]() });
};

export type ModelFieldMap = Catalog<ModelFieldEntry, ColumnName, ModelFieldInfo>;
const modelFieldCatalog = (entries: readonly ModelFieldEntry[]): ModelFieldMap => catalog(entries, { key: entry => entry.column, value: entry => entry.info, entry: (key, value) => ({ column: SemanticValueFactory.columnName(key), info: value }), keyText: stringValue }) as ModelFieldMap;
export const ModelFieldMap = Object.freeze({ empty: (): ModelFieldMap => modelFieldCatalog([]), fromEntries: (entries: readonly ModelFieldEntry[]): ModelFieldMap => modelFieldCatalog(entries), fromObject: (record: Readonly<{ readonly [key: string]: ModelFieldInfo }>): ModelFieldMap => modelFieldCatalog([]).fromObject(record), fromRecord: (record: Readonly<{ readonly [key: string]: ModelFieldInfo }>): ModelFieldMap => modelFieldCatalog([]).fromObject(record) });

export type ModelRelationMap = Catalog<ModelRelationEntry, RelationName, ModelRelationInfo>;
const modelRelationCatalog = (entries: readonly ModelRelationEntry[]): ModelRelationMap => catalog(entries, { key: entry => entry.relationName, value: entry => entry.info, entry: (key, value) => ({ relationName: SemanticValueFactory.relationName(key), info: value }), keyText: stringValue }) as ModelRelationMap;
export const ModelRelationMap = Object.freeze({ empty: (): ModelRelationMap => modelRelationCatalog([]), fromEntries: (entries: readonly ModelRelationEntry[]): ModelRelationMap => modelRelationCatalog(entries), fromObject: (record: Readonly<{ readonly [key: string]: ModelRelationInfo }>): ModelRelationMap => modelRelationCatalog([]).fromObject(record), fromRecord: (record: Readonly<{ readonly [key: string]: ModelRelationInfo }>): ModelRelationMap => modelRelationCatalog([]).fromObject(record) });

export type ModelAccessorMap<T> = Catalog<ModelAccessorEntry<T>, string, T>;
const modelAccessorCatalog = <T>(entries: readonly ModelAccessorEntry<T>[]): ModelAccessorMap<T> => catalog(entries, { key: entry => stringValue(entry.name), value: entry => entry.accessor, entry: (key, value) => ({ name: SemanticValueFactory.methodName(key), accessor: value }), keyText: value => value }) as ModelAccessorMap<T>;
export const ModelAccessorMap = Object.freeze({ empty: <T>(): ModelAccessorMap<T> => modelAccessorCatalog<T>([]), fromEntries: <T>(entries: readonly ModelAccessorEntry<T>[]): ModelAccessorMap<T> => modelAccessorCatalog(entries), fromObject: <T>(record: Readonly<{ readonly [key: string]: T }>): ModelAccessorMap<T> => modelAccessorCatalog<T>([]).fromObject(record), fromRecord: <T>(record: Readonly<{ readonly [key: string]: T }>): ModelAccessorMap<T> => modelAccessorCatalog<T>([]).fromObject(record) });

export type ModelServiceMap<T> = Catalog<ModelServiceEntry<T>, string, T>;
const modelServiceCatalog = <T>(entries: readonly ModelServiceEntry<T>[]): ModelServiceMap<T> => catalog(entries, { key: entry => stringValue(entry.name), value: entry => entry.service, entry: (key, value) => ({ name: SemanticValueFactory.propertyName(key), service: value }), keyText: value => value }) as ModelServiceMap<T>;
export const ModelServiceMap = Object.freeze({ empty: <T>(): ModelServiceMap<T> => modelServiceCatalog<T>([]), fromEntries: <T>(entries: readonly ModelServiceEntry<T>[]): ModelServiceMap<T> => modelServiceCatalog(entries), fromObject: <T>(record: Readonly<{ readonly [key: string]: T }>): ModelServiceMap<T> => modelServiceCatalog<T>([]).fromObject(record), fromRecord: <T>(record: Readonly<{ readonly [key: string]: T }>): ModelServiceMap<T> => modelServiceCatalog<T>([]).fromObject(record) });

export type ModelControllerMap<T> = Catalog<ModelControllerEntry<T>, string, T>;
const modelControllerCatalog = <T>(entries: readonly ModelControllerEntry<T>[]): ModelControllerMap<T> => catalog(entries, { key: entry => stringValue(entry.name), value: entry => entry.controller, entry: (key, value) => ({ name: SemanticValueFactory.variableName(key), controller: value }), keyText: value => value }) as ModelControllerMap<T>;
export const ModelControllerMap = Object.freeze({ empty: <T>(): ModelControllerMap<T> => modelControllerCatalog<T>([]), fromEntries: <T>(entries: readonly ModelControllerEntry<T>[]): ModelControllerMap<T> => modelControllerCatalog(entries), fromObject: <T>(record: Readonly<{ readonly [key: string]: T }>): ModelControllerMap<T> => modelControllerCatalog<T>([]).fromObject(record), fromRecord: <T>(record: Readonly<{ readonly [key: string]: T }>): ModelControllerMap<T> => modelControllerCatalog<T>([]).fromObject(record) });

export type ModelNodeMap<T> = Catalog<ModelNodeEntry<T>, ModelName, T>;
const modelNodeCatalog = <T>(entries: readonly ModelNodeEntry<T>[]): ModelNodeMap<T> => catalog(entries, { key: entry => entry.name, value: entry => entry.node, entry: (key, value) => ({ name: SemanticValueFactory.modelName(key), node: value }), keyText: stringValue }) as ModelNodeMap<T>;
export const ModelNodeMap = Object.freeze({ empty: <T>(): ModelNodeMap<T> => modelNodeCatalog<T>([]), fromEntries: <T>(entries: readonly ModelNodeEntry<T>[]): ModelNodeMap<T> => modelNodeCatalog(entries), fromObject: <T>(record: Readonly<{ readonly [key: string]: T }>): ModelNodeMap<T> => modelNodeCatalog<T>([]).fromObject(record), fromRecord: <T>(record: Readonly<{ readonly [key: string]: T }>): ModelNodeMap<T> => modelNodeCatalog<T>([]).fromObject(record) });

export type SemanticModelMap<T> = Catalog<SemanticModelEntry<T>, ModelName, T>;
const semanticModelCatalog = <T>(entries: readonly SemanticModelEntry<T>[]): SemanticModelMap<T> => catalog(entries, { key: entry => entry.name, value: entry => entry.model, entry: (key, value) => ({ name: SemanticValueFactory.modelName(key), model: value }), keyText: stringValue }) as SemanticModelMap<T>;
export const SemanticModelMap = Object.freeze({ empty: <T>(): SemanticModelMap<T> => semanticModelCatalog<T>([]), fromEntries: <T>(entries: readonly SemanticModelEntry<T>[]): SemanticModelMap<T> => semanticModelCatalog(entries), fromObject: <T>(record: Readonly<{ readonly [key: string]: T }>): SemanticModelMap<T> => semanticModelCatalog<T>([]).fromObject(record), fromRecord: <T>(record: Readonly<{ readonly [key: string]: T }>): SemanticModelMap<T> => semanticModelCatalog<T>([]).fromObject(record) });

export type SemanticRelationMap<T> = Catalog<SemanticRelationEntry<T>, RelationName, T>;
const semanticRelationCatalog = <T>(entries: readonly SemanticRelationEntry<T>[]): SemanticRelationMap<T> => catalog(entries, { key: entry => entry.name, value: entry => entry.relation, entry: (key, value) => ({ name: SemanticValueFactory.relationName(key), relation: value }), keyText: stringValue }) as SemanticRelationMap<T>;
export const SemanticRelationMap = Object.freeze({ empty: <T>(): SemanticRelationMap<T> => semanticRelationCatalog<T>([]), fromEntries: <T>(entries: readonly SemanticRelationEntry<T>[]): SemanticRelationMap<T> => semanticRelationCatalog(entries), fromObject: <T>(record: Readonly<{ readonly [key: string]: T }>): SemanticRelationMap<T> => semanticRelationCatalog<T>([]).fromObject(record), fromRecord: <T>(record: Readonly<{ readonly [key: string]: T }>): SemanticRelationMap<T> => semanticRelationCatalog<T>([]).fromObject(record) });
