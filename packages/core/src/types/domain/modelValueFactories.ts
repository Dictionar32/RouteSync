import type { ColumnName, ModelName, PropertyName, TableName } from './semanticValues';

export function createModelName(value: string): ModelName {
  return Object.freeze({ kind: 'model_name', value });
}

export function createTableName(value: string): TableName {
  return Object.freeze({ kind: 'table_name', value });
}

export function createColumnName(value: string): ColumnName {
  return Object.freeze({ kind: 'column_name', value });
}

export function createPropertyName(value: string): PropertyName {
  return Object.freeze({ kind: 'property_name', value });
}
