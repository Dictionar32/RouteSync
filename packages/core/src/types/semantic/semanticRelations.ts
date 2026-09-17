/**
 * semanticRelations.ts
 *
 * Eloquent relational ADT contracts and semantic relation descriptors.
 *
 * @module core/types/semantic
 */

import type { SemanticFieldSet } from './semanticTypes';
import type { ModelName, ColumnName, RelationName, TableName } from '../domain/semanticValues';

export type SemanticRelationKind =
  | 'hasOne'
  | 'hasMany'
  | 'belongsTo'
  | 'belongsToMany'
  | 'morphTo'
  | 'morphMany';

export interface BelongsToManyRelationContract {
  readonly kind: 'belongsToMany';
  readonly model: ModelName;
  readonly foreignKey: ColumnName;
  readonly relatedKey: ColumnName;
  readonly pivotTable: TableName;
  readonly pivotFields: readonly (readonly [ColumnName, ColumnName])[];
}

export interface DirectRelationContract {
  readonly kind: 'hasOne' | 'hasMany' | 'belongsTo';
  readonly model: ModelName;
  readonly foreignKey: ColumnName;
  readonly localKey: ColumnName;
}

export interface MorphRelationContract {
  readonly kind: 'morphTo' | 'morphMany';
  readonly model: ModelName;
  readonly morphName: RelationName;
  readonly morphType: ColumnName;
  readonly morphId: ColumnName;
}

/**
 * Level 7 Complete Closed ADT for SemanticRelation (0 undefined, 0 null, 0 ?:).
 */
export type SemanticRelationContract =
  | BelongsToManyRelationContract
  | DirectRelationContract
  | MorphRelationContract;

export type SemanticRelation = SemanticRelationContract;
