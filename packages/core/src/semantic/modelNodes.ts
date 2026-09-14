/**
 * modelNodes.ts
 *
 * Semantic model graph nodes and Level 7 Complete Contracts.
 * Zero sentinel undefined, zero null, zero optional fields (0% porosity).
 *
 * @module core/semantic
 */

import type { SemanticResolution } from '../types/contract';
import type { FieldNode } from '../types/field';
import type { SourceRef } from '../types/semantic';

export interface ModelColumnContract {
  readonly name: string;
  readonly type: string;
  readonly nullable: boolean;
}

export type ModelColumn = {
  name: string;
  type: string;
  nullable: boolean;
};

export interface ModelRelationContract {
  readonly model: string;
  readonly type: string;
}

export type ModelRelation = {
  model: string;
  type: string;
};

/**
 * Level 7 Complete Contract for ModelAccessor (0 undefined, 0 null, 0 ?:).
 */
export interface ModelAccessorContract {
  readonly source: SourceRef;
  readonly ast: FieldNode;
  readonly semantic: SemanticResolution;
}

export type ModelAccessor = {
  source?: SourceRef;
  ast?: FieldNode;
  semantic?: SemanticResolution;
};

/**
 * Level 7 Complete Contract for ModelNode (0 undefined, 0 null, 0 ?:).
 */
export interface ModelNodeContract {
  readonly name: string;
  readonly table: string;
  readonly columns: readonly ModelColumnContract[];
  readonly fieldEntries: readonly (readonly [string, { readonly type: string; readonly nullable: boolean }])[];
  readonly castEntries: readonly (readonly [string, string])[];
  readonly accessorEntries: readonly (readonly [string, ModelAccessorContract])[];
  readonly relationEntries: readonly (readonly [string, ModelRelationContract])[];
  readonly layer: string;
  readonly resolvedAssignments: readonly (readonly [string, SemanticResolution])[];
  readonly assignmentEntries: readonly (readonly [string, FieldNode])[];
}

export type ModelNode = {
  name: string;
  table?: string;
  columns?: ModelColumn[];
  fields?: Record<string, { type: string; nullable: boolean }>;
  casts?: Record<string, string>;
  accessors?: Record<string, ModelAccessor>;
  relations?: Record<string, ModelRelation>;
  layer?: string;
  resolvedAssignments?: Record<string, SemanticResolution>;
  assignments?: Record<string, FieldNode>;
};
