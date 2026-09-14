/**
 * semanticRelations.ts
 *
 * Eloquent relational ADT contracts and semantic relation descriptors.
 *
 * @module core/types/semantic
 */

import type { SemanticFieldSet } from './semanticTypes';

export type SemanticRelationKind =
  | 'hasOne'
  | 'hasMany'
  | 'belongsTo'
  | 'belongsToMany'
  | 'morphTo'
  | 'morphMany';

export interface BelongsToManyRelationContract {
  readonly kind: 'belongsToMany';
  readonly model: string;
  readonly foreignKey: string;
  readonly relatedKey: string;
  readonly pivotTable: string;
  readonly pivotFields: readonly (readonly [string, string])[];
}

export interface DirectRelationContract {
  readonly kind: 'hasOne' | 'hasMany' | 'belongsTo';
  readonly model: string;
  readonly foreignKey: string;
  readonly localKey: string;
}

export interface MorphRelationContract {
  readonly kind: 'morphTo' | 'morphMany';
  readonly model: string;
  readonly morphName: string;
  readonly morphType: string;
  readonly morphId: string;
}

/**
 * Level 7 Complete Closed ADT for SemanticRelation (0 undefined, 0 null, 0 ?:).
 */
export type SemanticRelationContract =
  | BelongsToManyRelationContract
  | DirectRelationContract
  | MorphRelationContract;

export type SemanticRelation = {
  type: SemanticRelationKind;
  model: string;
  foreignKey?: string;
  localKey?: string;
  table?: string;
  pivot?: SemanticFieldSet;
};
