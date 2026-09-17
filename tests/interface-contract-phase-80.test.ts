import type { ParsedModel } from '../packages/core/src/types/domain/models';
import type { ModelName, PropertyName, ColumnName, TableName } from '../packages/core/src/types/domain/semanticValues';

const modelName: ModelName = { kind: 'model_name', value: 'Order' };
const shortName: ModelName = { kind: 'model_name', value: 'Order' };
const table: TableName = { kind: 'table_name', value: 'orders' };
const primaryKey: ColumnName = { kind: 'column_name', value: 'id' };
const property: PropertyName = { kind: 'property_name', value: 'status' };

const model: ParsedModel = {
  name: modelName,
  shortName,
  table,
  primaryKey,
  keyType: { kind: 'integer' },
  keySemanticType: { kind: 'primitive', type: 'number' },
  incrementing: true,
  softDeletes: false,
  timestamps: true,
  columns: [],
  fillable: [property],
  guarded: [],
  hidden: [],
  appends: [],
  casts: [],
  accessors: [],
  relations: []
};

void model;
