import type { FieldNode } from '../field';
import type { ModelName, PropertyName, SourceFilePath, SourceLineNumber, TypeExpression } from '../ir/nominalVocabulary';
import type { Nullability } from './modelContracts';

export interface ColumnDefinitionContract {
  readonly name: PropertyName;
  readonly type: TypeExpression;
  readonly nullability: Nullability;
}

export type ColumnDefinition = ColumnDefinitionContract;

export type ModelRelationKind = 'belongs_to' | 'has_one' | 'has_many' | 'belongs_to_many' | 'morph_one' | 'morph_many' | 'unknown';

export interface ModelRelationDefinitionContract {
  readonly kind: ModelRelationKind;
  readonly model: ModelName;
}

export type ModelRelationDefinition = ModelRelationDefinitionContract;

export interface ResourceDefContract {
  readonly name: ModelName;
  readonly model: ModelName;
  readonly fields: readonly (readonly [PropertyName, FieldNode])[];
  readonly assignments: readonly (readonly [PropertyName, TypeExpression])[];
  readonly sourceFile: SourceFilePath;
  readonly sourceLine: SourceLineNumber;
}

export type ResourceDef = ResourceDefContract;

export interface ModelDefContract {
  readonly name: ModelName;
  readonly table: import("./semanticValues").TableName;
  readonly columns: readonly ColumnDefinitionContract[];
  readonly hidden: readonly PropertyName[];
  readonly appends: readonly PropertyName[];
  readonly casts: readonly (readonly [PropertyName, TypeExpression])[];
  readonly relations: readonly (readonly [PropertyName, ModelRelationDefinitionContract])[];
  readonly accessors: readonly (readonly [PropertyName, FieldNode])[];
}

export type ModelDef = ModelDefContract;
