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

/**
 * Canonical ResourceDef.
 * The legacy optional/nullable shape is intentionally removed from the domain
 * contract. Partial scanner input must be normalized before entering here.
 */
export type ResourceDef = ResourceDefContract;

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

/**
 * Canonical ModelDef.
 * The legacy optional/nullable shape is intentionally removed from the domain
 * contract. Partial scanner input must be normalized before entering here.
 */
export type ModelDef = ModelDefContract;
