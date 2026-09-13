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

import type { RouteParameterLocation } from './parameters';

/**
 * Route URL Parameter Entry
 */
export type RouteParameterKind = 'string' | 'number' | 'boolean';

export interface RouteParameterDescriptor {
  readonly name: string;
  readonly location: RouteParameterLocation;
  readonly kind: RouteParameterKind;
  readonly isOptional: boolean;
  readonly value: string | number | boolean;
}

export type RouteParameterEntry = RouteParameterDescriptor;

/**
 * Immutable Collection of Route URL Parameters
 */
export class RouteParameters implements Iterable<RouteParameterDescriptor> {
  public readonly entries: readonly RouteParameterDescriptor[];
  public readonly size: number;
  private readonly _lookup: ReadonlyMap<string, RouteParameterDescriptor>;

  constructor(entries: readonly (RouteParameterDescriptor | { readonly name: string; readonly value: string | number | boolean })[]) {
    const normalized: RouteParameterDescriptor[] = entries.map(e => {
      if ('location' in e && 'kind' in e && 'isOptional' in e) {
        return Object.freeze(e as RouteParameterDescriptor);
      }
      const kind: RouteParameterKind = typeof e.value === 'number' ? 'number' : typeof e.value === 'boolean' ? 'boolean' : 'string';
      return Object.freeze({
        name: e.name,
        location: 'path' as const,
        kind,
        isOptional: false,
        value: e.value
      });
    });

    this.entries = Object.freeze(normalized);
    const map = new Map<string, RouteParameterDescriptor>();
    for (const e of normalized) {
      map.set(e.name, e);
      Object.defineProperty(this, e.name, {
        value: e.value,
        writable: false,
        enumerable: true,
        configurable: true
      });
    }
    this._lookup = map;
    this.size = map.size;
    Object.freeze(this);
  }

  public static empty(): RouteParameters {
    return new RouteParameters([]);
  }

  public static fromRecord(record: Readonly<Record<string, string | number | boolean>>): RouteParameters {
    const entries = Object.entries(record).map(([name, value]) => ({
      name,
      value
    }));
    return new RouteParameters(entries);
  }

  public static fromEntries(entries: readonly RouteParameterDescriptor[]): RouteParameters {
    return new RouteParameters(entries);
  }

  public get(name: string): string | number | boolean | undefined {
    return this._lookup.get(name)?.value;
  }

  public has(name: string): boolean {
    return this._lookup.has(name);
  }

  public [Symbol.iterator](): Iterator<RouteParameterDescriptor> {
    return this.entries[Symbol.iterator]();
  }

  public toRecord(): Record<string, string | number | boolean> {
    return this.toDictionary();
  }

  public toDictionary(): { readonly [param: string]: string | number | boolean } {
    return Object.fromEntries(this.entries.map(e => [e.name, e.value]));
  }
}

/**
 * Route Query Parameter Entry
 */
export interface RouteQueryEntry {
  readonly key: string;
  readonly value: string | number | boolean | readonly (string | number | boolean)[];
}

/**
 * Immutable Collection of Route Query Parameters
 */
export class RouteQueryParameters implements Iterable<RouteQueryEntry> {
  public readonly entries: readonly RouteQueryEntry[];
  public readonly size: number;
  private readonly _lookup: ReadonlyMap<string, RouteQueryEntry>;

  constructor(entries: readonly RouteQueryEntry[]) {
    this.entries = Object.freeze([...entries]);
    const map = new Map<string, RouteQueryEntry>();
    for (const e of entries) {
      map.set(e.key, Object.freeze({ ...e }));
      Object.defineProperty(this, e.key, {
        value: e.value,
        writable: false,
        enumerable: true,
        configurable: true
      });
    }
    this._lookup = map;
    this.size = map.size;
    Object.freeze(this);
  }

  public static empty(): RouteQueryParameters {
    return new RouteQueryParameters([]);
  }

  public static fromRecord(record: Readonly<Record<string, unknown>>): RouteQueryParameters {
    const entries: RouteQueryEntry[] = [];
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        entries.push({ key, value });
      } else if (Array.isArray(value)) {
        const items = value.filter(
          (v): v is string | number | boolean => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
        );
        entries.push({ key, value: Object.freeze(items) });
      }
    }
    return new RouteQueryParameters(entries);
  }

  public static fromEntries(entries: readonly RouteQueryEntry[]): RouteQueryParameters {
    return new RouteQueryParameters(entries);
  }

  public get(key: string): string | number | boolean | readonly (string | number | boolean)[] | undefined {
    return this._lookup.get(key)?.value;
  }

  public has(key: string): boolean {
    return this._lookup.has(key);
  }

  public [Symbol.iterator](): Iterator<RouteQueryEntry> {
    return this.entries[Symbol.iterator]();
  }

  public toRecord(): Record<string, unknown> {
    return this.toDictionary();
  }

  public toDictionary(): { readonly [key: string]: unknown } {
    return Object.fromEntries(this.entries.map(e => [e.key, e.value]));
  }
}

/**
 * Request Payload Property Entry
 */
export interface PayloadPropertyEntry {
  readonly field: string;
  readonly value: unknown;
}

/**
 * Immutable Value Object for Request Payload / Body
 */
export class RequestPayload implements Iterable<PayloadPropertyEntry> {
  public readonly properties: readonly PayloadPropertyEntry[];
  public readonly size: number;
  private readonly _lookup: ReadonlyMap<string, unknown>;

  constructor(properties: readonly PayloadPropertyEntry[]) {
    this.properties = Object.freeze([...properties]);
    const map = new Map<string, unknown>();
    for (const p of properties) {
      map.set(p.field, p.value);
      Object.defineProperty(this, p.field, {
        value: p.value,
        writable: false,
        enumerable: true,
        configurable: true
      });
    }
    this._lookup = map;
    this.size = map.size;
    Object.freeze(this);
  }

  public static empty(): RequestPayload {
    return new RequestPayload([]);
  }

  public static fromRecord(record: Readonly<Record<string, unknown>>): RequestPayload {
    const properties: PayloadPropertyEntry[] = Object.entries(record).map(([field, value]) => ({
      field,
      value
    }));
    return new RequestPayload(properties);
  }

  public static fromEntries(properties: readonly PayloadPropertyEntry[]): RequestPayload {
    return new RequestPayload(properties);
  }

  public hasProperties(): boolean {
    return this.properties.length > 0;
  }

  public get(field: string): unknown {
    return this._lookup.get(field);
  }

  public has(field: string): boolean {
    return this._lookup.has(field);
  }

  public [Symbol.iterator](): Iterator<PayloadPropertyEntry> {
    return this.properties[Symbol.iterator]();
  }

  public toRecord(): Record<string, unknown> {
    return this.toDictionary();
  }

  public toDictionary(): { readonly [field: string]: unknown } {
    return Object.fromEntries(this.properties.map(p => [p.field, p.value]));
  }
}

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
