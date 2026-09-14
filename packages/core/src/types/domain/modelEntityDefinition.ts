/**
 * modelEntityDefinition.ts
 *
 * ResourceDef and ModelDef domain definitions and Level 7 Complete Contracts.
 * Zero sentinel undefined, zero null, zero optional fields (0% porosity).
 *
 * @module core/types/domain
 */

import type { FieldNode } from '../field';

export interface ColumnDefinitionContract {
  readonly name: string;
  readonly type: string;
  readonly nullable: boolean;
}

export type ColumnDefinition = {
  readonly name: string;
  readonly type: string;
  readonly nullable: boolean;
};

export interface ModelRelationDefinitionContract {
  readonly type: string;
  readonly model: string;
}

export type ModelRelationDefinition = {
  readonly type: string;
  readonly model: string;
};

/**
 * Level 7 Complete Contract for ResourceDef (0 undefined, 0 null, 0 ?:).
 */
export interface ResourceDefContract {
  readonly name: string;
  readonly model: string;
  readonly fields: readonly (readonly [string, FieldNode])[];
  readonly assignments: readonly (readonly [string, string])[];
  readonly sourceFile: string;
  readonly sourceLine: number;
}

export type ResourceDef = {
  name: string;
  model?: string;
  fields: Record<string, FieldNode>;
  assignments?: Record<string, string>;
  sourceFile?: string | null;
  sourceLine?: number | null;
};

/**
 * Level 7 Complete Contract for ModelDef (0 undefined, 0 null, 0 ?:).
 */
export interface ModelDefContract {
  readonly name: string;
  readonly table: string;
  readonly columns: readonly ColumnDefinitionContract[];
  readonly hidden: readonly string[];
  readonly appends: readonly string[];
  readonly casts: readonly (readonly [string, string])[];
  readonly relations: readonly (readonly [string, ModelRelationDefinitionContract])[];
  readonly accessors: readonly (readonly [string, FieldNode])[];
}

export type ModelDef = {
  name: string;
  table?: string;
  columns?: { name: string; type: string; nullable: boolean }[];
  hidden?: string[];
  appends?: string[];
  casts?: Record<string, string>;
  relations?: Record<string, { type: string; model: string }>;
  accessors?: Record<string, FieldNode>;
};
