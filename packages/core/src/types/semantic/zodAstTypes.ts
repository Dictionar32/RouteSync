/**
 * zodAstTypes.ts
 *
 * Intermediate AST representation for Zod schema generation.
 *
 * @module core/types/semantic
 */

import type { Lookup } from '../upstream/collections';
import type { PropertyName } from '../upstream/names';
import { SemanticValueFactory } from '../domain/semanticValues';
import { relationEqual } from '../../semantic/kernel/semanticRelations';
import { relationFirstOption, relationOptionFold, relationProject } from '../../semantic/kernel/relationalSequence';

export interface ZodPropertyEntry {
  readonly key: PropertyName;
  readonly schema: ZodAST;
}

export class ZodObjectShape implements Iterable<ZodPropertyEntry> {
  public readonly properties: readonly ZodPropertyEntry[];


  constructor(properties: readonly ZodPropertyEntry[]) {
    this.properties = Object.freeze([...properties]);
    Object.freeze(this);
  }

  public static empty(): ZodObjectShape {
    return new ZodObjectShape([]);
  }

  public static fromRecord(record: Readonly<{ readonly [key: string]: ZodAST }>): ZodObjectShape {
    const properties = relationProject(Object.entries(record), ([key, schema]) => ({ key: SemanticValueFactory.propertyName(key), schema }));
    return new ZodObjectShape(properties);
  }

  public static fromEntries(properties: readonly ZodPropertyEntry[]): ZodObjectShape {
    return new ZodObjectShape(properties);
  }

  public lookup(key: PropertyName): Lookup<ZodPropertyEntry> {
    return relationOptionFold(
      relationFirstOption(this.properties, entry => relationEqual(entry.key.value.value, key.value.value)),
      () => ({ kind: 'missing' }),
      value => ({ kind: 'found', value }),
    );
  }
  public has(key: PropertyName): boolean { return relationOptionFold(relationFirstOption(this.properties, entry => relationEqual(entry.key.value.value, key.value.value)), () => false, () => true); }
  public get size(): number { return this.properties.length; }
  public [Symbol.iterator](): Iterator<ZodPropertyEntry> { return this.properties[Symbol.iterator](); }
  public toRecord(): { readonly [key: string]: ZodAST } {
    return Object.fromEntries(relationProject(this.properties, p => [p.key.value.value, p.schema] as const));
  }
}

export interface ZodObjectNode { readonly kind: "zod_object"; readonly shape: ZodObjectShape; }
export interface ZodStringNode { readonly kind: "zod_string"; }
export interface ZodNumberNode { readonly kind: "zod_number"; }
export interface ZodBooleanNode { readonly kind: "zod_boolean"; }
export interface ZodArrayNode { readonly kind: "zod_array"; readonly element: ZodAST; }
export interface ZodOptionalNode { readonly kind: "zod_optional"; readonly inner: ZodAST; }
export interface ZodUnionNode { readonly kind: "zod_union"; readonly options: readonly ZodAST[]; }
export interface ZodLiteralNode { readonly kind: "zod_literal"; readonly value: string | number | boolean; }
export interface ZodUnknownNode { readonly kind: "zod_unknown"; }

export type ZodAST =
  | ZodObjectNode
  | ZodStringNode
  | ZodNumberNode
  | ZodBooleanNode
  | ZodArrayNode
  | ZodOptionalNode
  | ZodUnionNode
  | ZodLiteralNode
  | ZodUnknownNode;
