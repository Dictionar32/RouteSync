/**
 * Domain Models for Request Layer
 *
 * Eliminates naked `Record<string, any>` in favor of strongly-typed,
 * immutable Value Objects and Domain Collections.
 * Follows Rule 10, 11, and 12: Complete Contracts (0 '?', 0 'null'),
 * 100% direct assignment in constructors, and static semantic factories.
 *
 * @module types/domain/requestModels
 */

/**
 * Standard Header Declaration Entry (Pure Domain Entity)
 */
export interface HeaderDeclaration {
  readonly canonicalName: string;
  readonly value: string;
  readonly isSensitive: boolean;
}

/**
 * Immutable HTTP Headers Value Object with Case-Insensitive O(1) Lookup.
 * Guarantees non-nullable return types and eliminates defensive checks.
 */
export class RequestHeaders implements Iterable<HeaderDeclaration> {
  public readonly size: number;
  private readonly _entries: ReadonlyMap<string, HeaderDeclaration>;

  constructor(entries: readonly (readonly [string, string])[]) {
    const map = new Map<string, HeaderDeclaration>();
    for (const [k, v] of entries) {
      const lower = k.toLowerCase();
      const decl: HeaderDeclaration = Object.freeze({
        canonicalName: lower,
        value: v,
        isSensitive: lower === 'authorization' || lower === 'cookie' || lower === 'x-xsrf-token'
      });
      map.set(lower, decl);
      Object.defineProperty(this, k, {
        value: v,
        writable: false,
        enumerable: true,
        configurable: true
      });
    }
    this._entries = map;
    this.size = map.size;
    Object.freeze(this);
  }

  public static empty(): RequestHeaders {
    return new RequestHeaders([]);
  }

  public static fromRecord(record: Readonly<Record<string, string>>): RequestHeaders {
    return new RequestHeaders(Object.entries(record));
  }

  public static fromEntries(entries: readonly (readonly [string, string])[]): RequestHeaders {
    return new RequestHeaders(entries);
  }

  public get(name: string): string {
    const item = this._entries.get(name.toLowerCase());
    return item !== undefined ? item.value : '';
  }

  public has(name: string): boolean {
    return this._entries.has(name.toLowerCase());
  }

  public [Symbol.iterator](): Iterator<HeaderDeclaration> {
    return this._entries.values();
  }

  public entries(): IterableIterator<[string, string]> {
    const list: [string, string][] = Array.from(this._entries.values()).map(h => [h.canonicalName, h.value]);
    return list[Symbol.iterator]();
  }

  public toRecord(): Readonly<Record<string, string>> {
    return this.toDictionary();
  }

  public toDictionary(): { readonly [header: string]: string } {
    return Object.fromEntries(Array.from(this._entries.values()).map(h => [h.canonicalName, h.value]));
  }
}

import type { RouteParameterLocation } from '../upstream/route';
import type { PropertyName, RouteParameterName } from '../upstream/names';
import type { NumberValue, StringValue, TruthValue } from '../upstream/valueObjects';

/**
 * Runtime request values. The runtime boundary preserves value meaning instead
 * of collapsing it into primitive unions or `unknown`.
 */
export type RequestRuntimeValue =
  | { readonly kind: 'string'; readonly value: StringValue }
  | { readonly kind: 'number'; readonly value: NumberValue }
  | { readonly kind: 'boolean'; readonly value: TruthValue }
  | { readonly kind: 'null_value' }
  | { readonly kind: 'list'; readonly items: readonly RequestRuntimeValue[] }
  | { readonly kind: 'object'; readonly properties: readonly RuntimeObjectProperty[] };

export type RouteParameterKind = Extract<RequestRuntimeValue['kind'], 'string' | 'number' | 'boolean'>;

export interface RuntimeObjectProperty {
  readonly name: PropertyName;
  readonly value: RequestRuntimeValue;
}

export type RouteParameterDescriptor = {
  readonly kind: 'route_parameter_value';
  readonly name: RouteParameterName;
  readonly property: PropertyName;
  readonly location: RouteParameterLocation;
  readonly value: RequestRuntimeValue;
};

export type RouteParameterEntry = RouteParameterDescriptor;

export class RouteParameters implements Iterable<RouteParameterDescriptor> {
  public readonly entries: readonly RouteParameterDescriptor[];
  public readonly size: number;
  private readonly _lookup: ReadonlyMap<string, RouteParameterDescriptor>;

  constructor(entries: readonly RouteParameterDescriptor[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<string, RouteParameterDescriptor>();
    for (const entry of entries) {
      map.set(entry.name.value.value, Object.freeze(entry));
    }
    this._lookup = map;
    this.size = map.size;
    Object.freeze(this);
  }

  public static empty(): RouteParameters {
    return new RouteParameters([]);
  }

  public static fromEntries(entries: readonly RouteParameterDescriptor[]): RouteParameters {
    return new RouteParameters(entries);
  }

  public lookup(name: RouteParameterName): RouteParameterLookup {
    const entry = this._lookup.get(name.value.value);
    return entry === undefined
      ? { kind: 'missing', name }
      : { kind: 'found', entry };
  }

  public has(name: RouteParameterName): boolean {
    return this._lookup.has(name.value.value);
  }

  public [Symbol.iterator](): Iterator<RouteParameterDescriptor> {
    return this.entries[Symbol.iterator]();
  }
}

export type RouteParameterLookup =
  | { readonly kind: 'found'; readonly entry: RouteParameterDescriptor }
  | { readonly kind: 'missing'; readonly name: RouteParameterName };

/** Route query entry with semantic key and recursive runtime value. */
export interface RouteQueryEntry {
  readonly kind: 'route_query_entry';
  readonly key: PropertyName;
  readonly value: RequestRuntimeValue;
}

export class RouteQueryParameters implements Iterable<RouteQueryEntry> {
  public readonly entries: readonly RouteQueryEntry[];
  public readonly size: number;
  private readonly _lookup: ReadonlyMap<string, RouteQueryEntry>;

  constructor(entries: readonly RouteQueryEntry[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<string, RouteQueryEntry>();
    for (const entry of entries) {
      map.set(entry.key.value.value, Object.freeze(entry));
    }
    this._lookup = map;
    this.size = map.size;
    Object.freeze(this);
  }

  public static empty(): RouteQueryParameters {
    return new RouteQueryParameters([]);
  }

  public static fromEntries(entries: readonly RouteQueryEntry[]): RouteQueryParameters {
    return new RouteQueryParameters(entries);
  }

  public lookup(key: PropertyName): RouteQueryLookup {
    const entry = this._lookup.get(key.value.value);
    return entry === undefined ? { kind: 'missing', key } : { kind: 'found', entry };
  }

  public has(key: PropertyName): boolean {
    return this._lookup.has(key.value.value);
  }

  public [Symbol.iterator](): Iterator<RouteQueryEntry> {
    return this.entries[Symbol.iterator]();
  }
}

export type RouteQueryLookup =
  | { readonly kind: 'found'; readonly entry: RouteQueryEntry }
  | { readonly kind: 'missing'; readonly key: PropertyName };

/** Request payload property entry. */
export interface PayloadPropertyEntry {
  readonly kind: 'payload_property';
  readonly field: PropertyName;
  readonly value: RequestRuntimeValue;
}

export class RequestPayload implements Iterable<PayloadPropertyEntry> {
  public readonly properties: readonly PayloadPropertyEntry[];
  public readonly size: number;
  private readonly _lookup: ReadonlyMap<string, PayloadPropertyEntry>;

  constructor(properties: readonly PayloadPropertyEntry[]) {
    this.properties = Object.freeze([...properties]);
    const map = new Map<string, PayloadPropertyEntry>();
    for (const property of properties) {
      map.set(property.field.value.value, Object.freeze(property));
    }
    this._lookup = map;
    this.size = map.size;
    Object.freeze(this);
  }

  public static empty(): RequestPayload {
    return new RequestPayload([]);
  }

  public static fromEntries(properties: readonly PayloadPropertyEntry[]): RequestPayload {
    return new RequestPayload(properties);
  }

  public lookup(field: PropertyName): PayloadPropertyLookup {
    const property = this._lookup.get(field.value.value);
    return property === undefined ? { kind: 'missing', field } : { kind: 'found', property };
  }

  public has(field: PropertyName): boolean {
    return this._lookup.has(field.value.value);
  }

  public [Symbol.iterator](): Iterator<PayloadPropertyEntry> {
    return this.properties[Symbol.iterator]();
  }
}

export type PayloadPropertyLookup =
  | { readonly kind: 'found'; readonly property: PayloadPropertyEntry }
  | { readonly kind: 'missing'; readonly field: PropertyName };

/**
 * Null Object Pattern for Route Schema: Validates without errors, 0 'null', 0 '?'
 */
export class RouteSchemaModel {
  public readonly parse: (input: unknown) => unknown;
  public readonly safeParse: (input: unknown) => { readonly success: true; readonly data: unknown };

  constructor() {
    this.parse = (input: unknown) => input;
    this.safeParse = (input: unknown) => ({ success: true, data: input });
    Object.freeze(this);
  }

  public static empty(): RouteSchemaModel {
    return new RouteSchemaModel();
  }
}

/**
 * Null Object Pattern for Response Schema: Validates with identity, 0 'null', 0 '?'
 */
export class ResponseSchemaModel<T = unknown> {
  public readonly parse: (input: unknown) => T;
  public readonly safeParse: (input: unknown) => { readonly success: true; readonly data: T };

  constructor() {
    this.parse = (input: unknown) => input as T;
    this.safeParse = (input: unknown) => ({ success: true, data: input as T });
    Object.freeze(this);
  }

  public static empty<T = unknown>(): ResponseSchemaModel<T> {
    return new ResponseSchemaModel<T>();
  }
}

/**
 * Null Object Pattern for Route Mapper: Identity function pass-through, 0 'null', 0 '?'
 */
export class RouteMapperModel {
  public static identity(): (value: unknown) => unknown {
    return (value: unknown) => value;
  }
}
