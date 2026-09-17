import type { ParsedColumn } from './databaseColumns';
import type { ParsedCast, ParsedAccessor, ParsedRelation } from './eloquentTypes';
import type { ModelKeySemanticType, ModelKeyType } from './modelContracts';
import type { ColumnName, ModelName, PropertyName, TableName } from './semanticValues';

/** High-model Eloquent representation. Every identity has one explicit shape. */
export interface ParsedModel {
  readonly name: ModelName;
  readonly shortName: ModelName;
  readonly table: TableName;
  readonly primaryKey: ColumnName;
  readonly keyType: ModelKeyType;
  readonly keySemanticType: ModelKeySemanticType;
  readonly incrementing: boolean;
  readonly softDeletes: boolean;
  readonly timestamps: boolean;
  readonly columns: readonly ParsedColumn[];
  readonly fillable: readonly PropertyName[];
  readonly guarded: readonly PropertyName[];
  readonly hidden: readonly PropertyName[];
  readonly appends: readonly PropertyName[];
  readonly casts: readonly ParsedCast[];
  readonly accessors: readonly ParsedAccessor[];
  readonly relations: readonly ParsedRelation[];
}
